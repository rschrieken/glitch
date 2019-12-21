const ResponseParser = require('./simpleparsers.js');
const WebsocketListener = require('./simplewebsocket.js');

const EventEmitter = require('events');

function ChatRoom(roomId, botuserId) {
  this.status = {
    lastPing : 0,
    cntPing: 0,
    lastMessage: 0,
    cntMessage: 0,
    room: roomId,
    user: botuserId,
    msg:''
  }

  this.ws;

  this.seenUsers = {};
  this.roomOwners = {};

}

ChatRoom.prototype = new EventEmitter();


function Room(activeRoomId, chatServerBaseUrl, authenticatedBrowser, activeFkey, uid) {
  
  var serverbase = chatServerBaseUrl;
  var roomId = activeRoomId;
  
  var urls = {
    'new': serverbase + '/chats/'+ roomId +'/messages/new',
    'info': serverbase + '/user/info',
    'auth': serverbase + '/ws-auth',
    'events': serverbase + '/chats/' + roomId + '/events',
    'leave': serverbase + '/chats/leave/' + roomId,
    'image': serverbase + '/upload/image'
  }
  
  var browser = authenticatedBrowser;
  
  var fkey = activeFkey;
  var userid = uid;
  
  var complete = false;

  ChatRoom.prototype.getUserid = function (){
     return userid;
  }

  ChatRoom.prototype.postMessage = function (msg) {
   // var url = serverbase + '/chats/'+ roomId +'/messages/new';
    var self = this;
    this.emit('action', 'message');
    function executor(resolve,reject) {
      browser.postform(urls.new, {
            text: msg,
            fkey: fkey
          }).
      then((res) => {
          self.status.lastMessage = Date.now();
          self.status.cntMessage++;
          self.status.msg = 'message posted';
          self.emit('status', self.status);
          resolve(self.status) 
      }).catch(reject);  
    }
    return new Promise(executor);
  }

  ChatRoom.prototype.postInfo = function  (userIds, forcedIds) {

   // var url = serverbase + '/user/info';
    var users;
    var self = this;
    this.emit('action', 'info');
    
    // console.log('postInfo 1', userIds, forcedIds);
    
    function cleanUserIds(userIds) {
      // console.log('pi clean seenUsers', self.seenUsers);
      var clean = [];
      (forcedIds || []).forEach( function(user) {
          clean.push(user.user_id);
          var currentUser = self.seenUsers[user.user_id]; 
          if (currentUser !== undefined) {
            currentUser.last_seen = user.last_seen;  
          }
      });
      userIds.forEach(function(user){
        // console.log('pi clean in foreach', user);
        var currentUser = self.seenUsers[user.user_id]; 
        // console.log('pi clean lookedup', currentUser);
        if (currentUser === undefined) {
          clean.push(user.user_id);
        } else {
          currentUser.last_seen = user.last_seen;
        }
      });
      console.log('postInfo clean', clean);
      return clean;
    }
    
    function fillUsersSeenAndRoomMods(usersinfo){
      //console.log('fillUsersSeenAndRoomMods', usersinfo);
      var users = usersinfo.users || [];
      users.forEach(function(user){
        var cnt = 0;
        if (self.seenUsers[user.id] !== undefined) {
          cnt = self.seenUsers[user.id].cnt || 0;
        } else {
          
        }
        self.seenUsers[user.id] = user;
        self.seenUsers[user.id].cnt = cnt;
        if (user.is_moderator === true || user.is_owner === true) {
          self.roomOwners[user.id] = user;
        }
      });
      console.log('fillUsersSeenAndRoomMods exit', self.seenUsers);
    }

    function executor(resolve,reject) { 
      if (users.length === 0) {
        resolve({})
      } else {
        browser.postform(urls.info, {
              ids: users.join(','),
              roomId: roomId
          }).
          then((res) => { 
            var respParser = new ResponseParser('json', res); 
            respParser.then((users) => { 
              fillUsersSeenAndRoomMods(users);
              resolve(users);
            });
        }); 
      }
    }

    users = cleanUserIds(userIds);
    return new Promise(executor);
  }

  ChatRoom.prototype.postWSauth = function (time, handler) {
      //var url = serverbase + '/ws-auth';
      var self = this;
      this.emit('action', 'ws-auth');
      function executor(resolve,reject) {
        
        browser.postform(urls.auth ,{
            roomid: roomId,
            fkey: fkey
          }).
        then( (res) => {  
          var respParser = new ResponseParser('json', res); 

          respParser.then((wsresp) => { 
            var socketHandler;
            console.log(wsresp.url + '?l=' + time);
             // wsresp.url + '?l=' + time
            socketHandler = handler || new WebsocketListener.SocketHandler(self);
            self.ws = WebsocketListener.StartWebSocketListener(wsresp.url + '?l=' + time, serverbase,  socketHandler);
            console.log('websocket created');  
          })
          resolve();
        }).catch(reject);
      }

      return new Promise(executor);
    }


    ChatRoom.prototype.postEvents = function (cnt) {
      //var url = serverbase + '/chats/' + roomId + '/events';
      this.emit('action', 'events');
      
     
      function executor(resolve,reject) {
        browser.postform(urls.events,{
            since: 0,
            mode: 'Messages',
            msgCount: cnt || 1,
            fkey: fkey
          }).
        then( (res) => { 
          var respParser = new ResponseParser('json', res); 
          respParser.then(resolve)
        }, (err)=>{ console.error('events:',err); reject(err) }
        ).catch(reject);
      }

      return new Promise(executor);
    }

    ChatRoom.prototype.postImage = function (url) {
      
      this.emit('action', 'image');
      
      function executor(resolve,reject) {
        
        browser.postform(urls.image,
          {
            'upload-url': url
          }).
          then((res) => {
            var imageParser = new ResponseParser('image', res); 
            imageParser.then((url)=>{
              console.log('pi resolve', url);
              resolve(url);
            }).catch((e)=>{
              console.log('pi catch', e);
              resolve(null);
            });
            
        });
      }
      return new Promise(executor);
    }  
  
  
    ChatRoom.prototype.postLeave = function () {
      // http://chat.meta.stackexchange.com/chats/leave/1034
      //var url = serverbase + '/chats/leave/' + roomId;
      this.emit('action', 'leave');
      if (this.ws !== undefined && this.ws !== null) this.ws.close(1012, 'stop');
      
      function executor(resolve,reject) {
        
        browser.postform(urls.leave,
          {
            quiet: true, 
            fkey: fkey
          }).
          then( resolve);
      }
      return new Promise(executor);
    }
    
    ChatRoom.prototype.init =  function () {
      var self = this;
      this.emit('action', 'init');
     
      function getUniqueUserids(events) {
        var userids = [];
          if (events) {
            events.forEach(function(event){
              var found = false;
              if (event.user_id) {
                userids.forEach(function(user){
                  if (user.user_id === event.user_id && !found) {
                      found = true;      
                  }
                });
                if (found === false){
                   userids.push({user_id: event.user_id});  
                }
              }
            });
          }
        return userids;
      }
      
      function executor(resolve,reject) {
        self.postEvents(100).then((ws) => { 
          var userids = getUniqueUserids(ws.events);
          self.postWSauth(ws.time).then(self.postMessage('Tada!!').then((msg) => {
            complete = true; 
            resolve(msg);
            self.postInfo(userids);
          })) 
        }); 
      }
      return new Promise(executor);
    }
  
    ChatRoom.prototype.getHostname = () => { return serverbase; },
    ChatRoom.prototype.getRoomId = () => { return roomId; },
    ChatRoom.prototype.isComplete = () => { return complete === true; }
   
  var thisRoomInstance = new ChatRoom(activeRoomId, uid);
  
  return thisRoomInstance;
}

module.exports = Room;