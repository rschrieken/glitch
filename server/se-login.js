const EventEmitter = require('events');

const browser = require('./simplebrowser.js');
const ResponseParser = require('./simpleparsers.js');
const Room = require('./se-chatroom.js');


class GlobalEmitter extends EventEmitter {}

const globalEmitter = new GlobalEmitter();


var roomInstance;
var webbrowser = new browser.Browser();

function postlogin(form, chatServerUrl, roomId) {
  
  var url = chatServerUrl.replace('chat.','') 
    + process.env.LOGINPATH 
    + '?returnurl=' 
    + chatServerUrl 
    + '%2frooms%2f'
    + roomId;
  
  function executor(resolve,reject) {
    webbrowser.postform(url,form).
    then((res) => {
      var respParser = new ResponseParser('ident',res);
      respParser.then( function(identity /*foundfkey, userid*/){
          roomInstance = new Room(roomId, chatServerUrl, webbrowser, identity.fkey, identity.userid);
          roomInstance.on('action', (m) => { globalEmitter.emit('action', m); });
          roomInstance.on('status', (s) => {          
            globalEmitter.emit('status', s); 
          });
          roomInstance.on('tick', (time) => { globalEmitter.emit('tick', time); });
          roomInstance.init().then(resolve);  
        }, reject);
    });
  }
  
  return new Promise(executor);
  
}
exports.status = function() {
  return roomInstance.status;
}

exports.statusEvents = function () {
  return globalEmitter;
}

exports.isLoginValid = function (body) {
  var expected = ['user', 'roomId', 'pwd', 'server'],
      notnull = ['user', 'roomId', 'pwd','server'],
      numbers = ['roomId','server'],
      domain = {} ,
      expectedFields = 0,
      notnullFields = 0,
      invalidFields = 0,
      numbersFields = 0;
  domain['server'] =  ['1','2','3'];
  for(var id in body){
    if (expected.indexOf(id) > -1) {
      expectedFields++;
      if (notnull.indexOf(id) > -1 && body[id] !== null && body[id].length > 0) {
        notnullFields++;
        if (numbers.indexOf(id) > -1 && !Number.isNaN(Number.parseInt(body[id],10))  ) {
          numbersFields++;
        }
      }
      for(var fld in domain) {
        if (fld === id) {
          if (domain[fld].indexOf(body[id]) === -1) {
            invalidFields++;
            console.log('domain %s not valid  for %s = "%s"',fld, id, body[id]);      
          }
        }
      }
    } else {
      invalidFields++;
      console.log(id);
    }
  }
  // console.log('%s:%s:%s', validFields, notnullFields, invalidFields);
  return ((expectedFields === expected.length) &&
          (notnullFields === notnull.length) && 
          (numbersFields == numbers.length) &&
          invalidFields === 0);
}

exports.isInitialized = function () {
  return roomInstance !== undefined && roomInstance !== null && roomInstance.isComplete();
}

exports.stop = function () {
  roomInstance.postLeave();
  roomInstance = null;
}

exports.login = function (user, pwd, roomId, server) {
  
  var loginurl, serverbase;
  
  switch(server) {
    case '1':
      serverbase = process.env.SERVERBASE1;
      break;
    case '2':
      serverbase = process.env.SERVERBASE2;
      break;
    case '3':
      serverbase = process.env.SERVERBASE3;
      break;
  }
    
  loginurl = serverbase.replace('chat.','') + process.env.LOGINPATH;
  
  function executor(resolve,reject) {
    console.log(loginurl);
    webbrowser.get(loginurl).
    then((res) => {
      var respParser = new ResponseParser('fkey',res);
      respParser.then( function(foundfkey){
          postlogin({ email: user, password:pwd, fkey: foundfkey }, serverbase, roomId).then(resolve).catch(reject);
        }, reject);
    });
  }
  
  return new Promise(executor);
};