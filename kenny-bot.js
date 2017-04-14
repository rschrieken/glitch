const util = require('./bots/util.js');
const index = require('./bots');

var room,
  //thisuser = window.CHAT.CURRENT_USER_ID,
  // roomOwners = {},
  // seenUsers = {},
  msg = [],
  silent = false,
  ownmsg = [Date.now()],
  unk,
  ownerCommand,
  states = [],
  prep = '~ ',
  started = Date.now(),
  throttle = util.seconds(2),
  room,
  interval = null;

/* put a chatmessage on the queue, either direct or after certain time*/
/* txt = text to send
   sorm = seconds if s is not given
        = munutes if s is given
  s   = seconds
*/
function send(txt, sorm, s) {
  var time,
    preptxt = (txt.indexOf(':') !== 0 ? prep : '') + txt;
  if (s === undefined && sorm === undefined) {
    msg.push(preptxt);
  } else {
    if (s === undefined) {
      time = util.seconds(sorm);
    } else {
      time = util.minutes(sorm) + util.seconds(s);
    }
    setTimeout(function () { msg.push(preptxt); }, util.getRandomArbitrary(time, time + (time / 2)));
  }
}

function sendraw(txt) {
  msg.push(txt);
}

function handleEvent(ce) {
  var i, commandExecuted, length, state, cmdRegex = /^(!!\w+)($|\s(\w*))/, cmd;
      commandExecuted = false;
  if (ce.user_id === room.getUserid() || room.roomOwners[ce.user_id] !== undefined ) {
      commandExecuted = ownerCommand.next(ce);
  }
  length = states.length;
  cmd = cmdRegex.exec(ce.content);
  for (i = 0; i < length && !commandExecuted; i = i + 1) {
    state = states[i];
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


function handleSeenUser(userid) {
  var cnt = 1;
  var fu = room.seenUsers[userid];
  if (fu !== undefined) {
     cnt = fu.cnt + 1;
  } else {
    room.seenUsers[userid] = {};
  }
  room.seenUsers[userid].cnt = cnt;
}

function handleBotOwner(uid) {
   // for throttling gather enough datapoints
  if (uid === room.getUserid()) {
    if (ownmsg.length > 100) {
      ownmsg.shift();
    }
    ownmsg.push(Date.now());
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

function isCurrentRateFine(seconds) {
    var limit = 0.0,
        a = seconds.length,
        b = 0,
        throttled = false,
        baseSecs = Date.now(),
        i;

    function rateLimit(x) {
        return Math.min((4.1484 * Math.log(x < 2 ? 2 : x) + 1.02242), 20);
    }

    for (i = seconds.length - 1; i > 0; i = i - 1) {
        limit = rateLimit(a - i);

        if (baseSecs - seconds[i] < limit && !throttled) {
            throttled = true;
            b = limit - (baseSecs - seconds[i]);
            baseSecs = seconds[i];
        } else {
            if (b - (baseSecs - seconds[i]) < 0) {
                a = i;
                throttled = false;
                baseSecs = seconds[i];
            }
            if (baseSecs - seconds[i] > limit && !throttled) {
                throttled = false;
            }

            if (baseSecs - seconds[i] > limit * 2) {
                a = i;
                throttled = false;
                baseSecs = seconds[i];
            }
        }
    }

    limit = rateLimit(a);

    return !(baseSecs - seconds[0] < limit);
}


function realsend(txt) {
  if (silent) {
      console.log(txt);
  } else {
    try {
      room.postMessage(txt).then(() => {if (throttle > util.seconds(2)) {
            throttle = throttle - Math.round(throttle / 4);
            if (throttle < util.seconds(2)) {
                throttle = util.seconds(2);
            }
        }
      });
    } catch(e) {
      console.log(e);
    }
  }
}

var botInterface = {
  send: send,
  sendraw: sendraw,
  started: started,
  seenUsers: function () {return room === undefined?{}:room.seenUsers },
  silence: function(val) {silent = val;},
  states: function () {
    var state, copy = [];
    for(var s =0; s< states.length; s++){
      state = states[s];
      if (state.command) {
        copy.push( { command: state.command });
      }
    }
    return copy;
  }
}

//load all commands for the bot
for(var cmd in index.commands) {
  var machine = new index.commands[cmd](botInterface);
  if (machine.isUnknown) unk = machine;
  if (machine.isOwner === true) {
    ownerCommand = machine;
  } else {
    states.push(machine);
  }
}

function init(roomInstance) {
  room = roomInstance;
  if (interval === null) {
    roomInstance.status.commands = botInterface.states();
    interval = setInterval(function () {
        var txt;
        if (isCurrentRateFine(ownmsg)) {
            txt = msg.shift();
            if (txt !== undefined) {
                realsend(txt);
            }
        } else {
            console.log('throtled:' + ownmsg[ownmsg.length - 1].toString());
        }
    }, util.seconds(2));
  }
}

exports.handleEvents = handleEvents;
exports.init = init;
exports.close = function () { clearInterval(interval); };