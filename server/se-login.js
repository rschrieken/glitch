const EventEmitter = require('events');

const ResponseParser = require('./simpleparsers.js');
const Room = require('./se-chatroom.js');


class GlobalEmitter extends EventEmitter {}

const globalEmitter = new GlobalEmitter();

var roomInstance;
var webbrowser;

function joinroom(roomId, chatServerUrl, webbrowser, identity) {
  roomInstance = new Room(roomId, chatServerUrl, webbrowser, identity.fkey, identity.userid);
  roomInstance.on('action', (m) => { globalEmitter.emit('action', m); });
  roomInstance.on('status', (s) => {          
    globalEmitter.emit('status', s); 
  });
  roomInstance.on('tick', (time) => { globalEmitter.emit('tick', time); });
  roomInstance.on('takecontrol', (key) => { globalEmitter.emit('takecontrol', key); });
  return roomInstance.init();  
}

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
        joinroom(roomId, chatServerUrl, webbrowser, identity).
          then(resolve,reject).
          catch((e)=> { console.log(e); reject('room joined failed'); });
        }, reject);
    });
  }
  
  return new Promise(executor);
  
}
function status () {
  return roomInstance.status;
}

function statusEvents () {
  return globalEmitter;
}

function isLoginValid (body) {
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
            //console.log('domain %s not valid  for %s = "%s"',fld, id, body[id]);      
          }
        }
      }
    } else {
      invalidFields++;
      //console.log(id);
    }
  }
  //console.log('%s:%s:%s:%s', expectedFields, notnullFields, numbersFields, invalidFields);
  return ((expectedFields === expected.length) &&
          (notnullFields === notnull.length) && 
          (numbersFields == numbers.length) &&
          invalidFields === 0);
}

function  isInitialized() {
  return roomInstance !== undefined && roomInstance !== null && roomInstance.isComplete();
}

function stop () {
  roomInstance.postLeave();
  roomInstance = null;
}

function getServerUrl(server) {
  var serverbase;
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
  return serverbase;
}

function login (user, pwd, roomId, server) {
  
  var loginurl, serverbase;
  
  serverbase = getServerUrl(server);
    
  loginurl = serverbase.replace('chat.','') + process.env.LOGINPATH;
  
  function executor(resolve,reject) {
    // universal auth is not that universal
    function loginse(url, form) {
      webbrowser.postform(url, form).then((res) =>{
        var resp2 = new ResponseParser('form',res);
        resp2.then((kof) =>{
          var parts = webbrowser.url().split('/');
          var hostname = parts[0]+'//' + parts[2];
          console.log('login se parsed ',kof, hostname);
          kof.form.email = user;
          kof.form.password = pwd;
          webbrowser.postform(hostname + kof.action, kof.form).then((ores) => {
            webbrowser.get(serverbase + '/rooms/' + roomId ).then( (chatres) => {
              var respParser = new ResponseParser('ident',chatres);
              respParser.then( function(identity /*foundfkey, userid*/){
                console.log(identity);
                joinroom(roomId, serverbase, webbrowser, identity).
                  then(resolve,reject).
                  catch((e)=> { console.log(e); reject('room joined failed'); });
              });
            });
          });
        }, reject);
      }).catch(reject);
    }
    
    console.log(loginurl);
    webbrowser.get(loginurl).
    then((res) => {
      var respParser = new ResponseParser('fkey',res);
      respParser.then( function(keyorform){
          if (keyorform.auth !== undefined) {
            loginse(
              serverbase.replace('chat.','') + keyorform.auth.post, 
              keyorform.auth.form
            );
          } else {
            postlogin(
              { 
                email: user, 
                password:pwd, 
                fkey: keyorform.fkey 
              }, 
              serverbase, 
              roomId).then(resolve).catch(reject);
          }
        }, reject);
    });
  }
  
  return new Promise(executor);
};

function autologin(server, roomId, userid, password) {
  var serverUrl = getServerUrl(server); 
  
  function executor(resolve, reject)
  {
    
    function login(url) {
      webbrowser.get(url).then((res)=>{
        var respParser = new ResponseParser('fkey',res);
        respParser.then((fkeyresp)=>{
          console.log(fkeyresp);
        });
      });
    }
    
    function needlogin(s) {
      console.warn('need to login', s);
      if (userid === undefined || password === undefined )
      {
        //without a user or pwd it is no use of proceeding
         resolve({ needlogin: true, url: s.url, fkey: s.fkey});
      } else {
        // let's try to login
        // this should bring you on the login 
        login(s.url);
      }
    }
    
    function cookiebasedlogin(s) {
      const regex = /^\/users\/(\d+)\/.*$/g;
      var matches = regex.exec(s.url);
      if (matches != null && matches.length >0) {
        s.userid = matches[1];
        console.info('already logged in', s);  
        joinroom(roomId, serverUrl, webbrowser, s).then(resolve).catch(reject);              
      } else {
        console.warn('already logged in but no userid', s);  
        reject('No auto login');
      }
    }
    
    function serverUrlParsedResponse(s) {
      if (s.url && s.url.indexOf('\/users\/login?returnurl=http') > 0 && s.username === 'log in' ) {
        needlogin(s);
      } else {
        cookiebasedlogin(s);
      }
    }
    
    function serverUrlResponse(res) {
      var resp = new ResponseParser('mainchat', res);
      resp.then(serverUrlParsedResponse);
    }
    
    webbrowser.get(serverUrl)
      .then(serverUrlResponse);
  }
  return new Promise(executor);
}

module.exports = function (browser) {
  webbrowser = new browser.Browser();
  return {
    login: login,
    autologin: autologin,
    stop: stop,
    isInitialized: isInitialized,
    isLoginValid: isLoginValid,
    statusEvents: statusEvents,
    status: status
  }
}