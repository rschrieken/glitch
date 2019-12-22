const glob = require( 'glob' ),
      path = require( 'path' ),
      Datastore= require( 'nedb' ),
      EventEmitter = require('events'),
      poster = require('./poster.js');

const Entities = require('html-entities').AllHtmlEntities;

const db = new Datastore({ filename: './.data/seenusers.db', autoload: true });

// make unique and reset state
db.find({}, function(err,docs) {
  if (err) {
    console.error('db find', err);
  } else {
    var d = {};
    docs.forEach(function(item) {
        // collect duplicates
        if (d[item.userid] === undefined) {
          d[item.userid] ={keys:[]};
        } else {
           d[item.userid].keys.push(item._id);
        }
    });
    
    console.log('dupes', d);
    // remove duplicates
    for(var p in d) {
      if (d.hasOwnProperty(p)) {
        var del = d[p];
        while(del.keys.length>0) {
          db.remove({_id: del.keys.shift() });
          // console.log(del.keys.shift());
        }
      }
    }
    // it should not be possible to have duplicates after this
    db.ensureIndex({ fieldName: 'userid', unique: true }, function (err) { 
      if (err) console.error('ensureIndex',err); 
    });
    
  }
});

db.persistence.setAutocompactionInterval(60*1000);
// reset session count
db.update({ cnt: {$gt:0} }, 
          {$set: { cnt: 0}}, 
          {upsert:false, multi: true }, 
          function(err,nr) {
            if (err) 
              console.error('reset session cnt',err); 
            else 
              console.log('reset state of %d', nr);
          });

const entities = new Entities();

class CommandEmitter extends EventEmitter {}

const cmdEmitter = new CommandEmitter();


var //commandCollection = [],
    commandInstances =[],
    room,
    messagePoster,
    unk,
    ownerCommand,
    started = Date.now();
    
function handleEvent(ce) {
  
  var i, commandExecuted, length, state, cmdRegex = /^(!!\w+)($|\s(.*))/, cmd;
      commandExecuted = false;
  if ((ce.user_id === room.getUserid() || 
       room.roomOwners[ce.user_id] !== undefined) &&
       ownerCommand !== undefined) {
      commandExecuted = ownerCommand.next(ce);
  }
  length = commandInstances.length;
  cmd = cmdRegex.exec(entities.decode(ce.content));
  for (i = 0; i < length && !commandExecuted; i = i + 1) {
    state = commandInstances[i];
    if ((state.events !== undefined && (state.events.indexOf(ce.event_type) > -1)) &&
        (state.command === undefined || (cmd !== null && cmd.length > 0 && cmd[1] === state.command))) {
      if (cmd !== null && cmd.length > 1) {
        state.next(ce, cmd[2]);
      } else {
        state.next(ce);
      }
      if (state.command !== undefined) {
        commandExecuted = true;
      }
    }
  }
  if (!commandExecuted
      && ce.event_type === 1
      && ce.content !== undefined) {
    if (ce.content.indexOf('!!') === 0) {
      unk.next();
    }
  }
}


function allSeenUsers() {
  return new Promise(function(resolve, reject) {
    db.find({}, function(err, docs) {
      if (err) resolve([]); 
      else resolve(docs);
    });
  });
}

function blockUser(userid) {
  // console.log('blockUser', userid);
  if (userid) {
    var num = parseInt(userid,10);
    if (isNaN(num)) return;
    db.update({userid: num }, { $set: {blocked: true}}, {upsert:false}, function(err, nr) {
      console.log(err, nr);});
  }
}

function unblockUser(userid) {
  if (userid) {
    var num = parseInt(userid,10);
    if (isNaN(num)) return;
    db.update({userid: num }, { $set: { blocked: false}}, {upsert:false});
  }
}


function handleSeenUser(userid) {
  var cnt = 1;
  var fu = room.seenUsers[userid];
  if (fu === undefined) return;
  cnt = fu.cnt + 1;
  room.seenUsers[userid].cnt = cnt;
  
  function insertUser() {
    db.insert({
        userid: userid, 
        name: (room.seenUsers[userid].name || userid.toString()),  
        cnt: cnt, 
        totalcnt: 1, 
        "last_seen": Date.now() }
    , function(err) {
        if (err) { 
          console.error(err);
          if (err.errorType === 'uniqueViolated') {
            updateOneUser({userid : userid});
          }
        }
      }
    );
  }
  
  function updateOneUser(query, blocked) {
      var username = room.seenUsers[userid].name ;
      if (blocked === true) username = 'user' + userid;
      db.update(query, { 
        $inc: { totalcnt: 1 }, 
        $set: { name: username, 
               "last_seen": Date.now() , 
               cnt: cnt } 
      }, 
      {upsert:false});
  }
  
  function updateUser(docs) {
      console.log('hsu update ',docs);
      updateOneUser({
        _id: docs[0]._id
      }, docs[0].blocked);
  }
  
  db.find({userid: userid}, function(err, docs) {
    if (err) console.error(err);
    
    if (docs.length === 0) {
      insertUser();
    } else {
      updateUser(docs);
    }
  });
}

function handleBotOwner(uid) {
   // for throttling gather enough datapoints
  if (uid === room.getUserid()) {
    messagePoster.ownMessageReceived();
  }
}

function handleUsers(uids) {
  uids.forEach(function(uid){
    handleBotOwner(uid);
    handleSeenUser(uid);
  });
}

function handleEvents(ce) {
  var userids = [];
  ce.forEach(function(event) {
    if (event.user_id) {
      userids.push(event.user_id);
    }
  });
  handleUsers(userids);
  ce.forEach(function(event) {
    handleEvent(event);      
  });
}

function statesAccessor() {
  var copy = [];
  commandInstances.forEach(function(state){
    if (state.command) {
      copy.push( { command: state.command, ttw: state.ttw, usage: state.usage });
    }
  });
  return copy;
}

function initBotCommands(botInterface) {
  //load all commands for the bot
  glob( './bots/commands/*.js', function(err, files){
    if (err) {
      console.log(err);
    } else {
      files.forEach(function(file) {
        var cmd = require( path.resolve( file ) );
        var machine = new cmd(botInterface);
        if (machine.isUnknown) unk = machine;
        if (machine.isOwner === true) {
          machine.extend({ blockUser: blockUser, unblockUser: unblockUser });
          ownerCommand = machine;
        } else {
          commandInstances.push(machine);
        }     
      });
      console.log('commands loaded');
      room.status.commands = statesAccessor();
    }
  });
}

function init(roomInstance) {
  messagePoster = new poster.MessagePoster(roomInstance);
  
  initBotCommands({
    send: messagePoster.send,
    silence: messagePoster.silent,
    uploadImage: messagePoster.uploadImage,
    started: started,
    seenUsers: function () {return roomInstance.seenUsers },
    allSeenUsers: allSeenUsers,
    states: statesAccessor,
    oncmd: cmdEmitter,
    getHostname: roomInstance.getHostname
  });
  
  room = roomInstance;
}

cmdEmitter.on('time', (cmd, time) => {
  
})

exports.handleEvents = handleEvents;
exports.init = init;
exports.close = function () {messagePoster.stop() };



