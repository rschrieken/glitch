const WebSocket = require('ws');

const Kenny = require('../bots');

var EventType = {
    MessagePosted: 1,
    MessageEdited: 2,
    UserEntered: 3,
    UserLeft: 4,
    RoomNameChanged: 5,
    MessageStarred: 6,
    DebugMessage: 7,
    UserMentioned: 8,
    MessageFlagged: 9,
    MessageDeleted: 10,
    FileAdded: 11,
    ModeratorFlag: 12,
    UserSettingsChanged: 13,
    GlobalNotification: 14,
    AccessLevelChanged: 15,
    UserNotification: 16,
    Invitation: 17,
    MessageReply: 18,
    MessageMovedOut: 19,
    MessageMovedIn: 20,
    TimeBreak: 21,
    FeedTicker: 22,
    UserSuspended: 29,
    UserMerged: 30,
    UserNameOrAvatarChanged: 34
};

function SocketHandler(roomInstance) {
  
  var roomId = roomInstance.getRoomId();
  Kenny.init(roomInstance);

  function getUniqueUserids(events) {
    var userids = [], forceIds = [];

    function addUnique(arr, key) {
      if (key && arr.indexOf(key) === -1){
          arr.push(key);
      }
    }

    function add(uid) {
      addUnique(userids, uid);
    }

    function addForced(uid) {
      addUnique(forceIds, uid);
    }

    if (events) {
      events.forEach(function(event){
        switch(event.event_type){
          case EventType.MessagePosted:
          case EventType.MessageEdited:
          case EventType.UserEntered:
            add(event.user_id);
            break;
          case EventType.UserNameOrAvatarChanged:
            addForced(event.target_user_id);
            break;
          default:
            break;
        }

      });
    }
    return {userIds:userids, forceIds:forceIds};
  }
    
  function message(m) {
    console.log('message: ', m.data);
    roomInstance.emit('tick', Date.now());
    var room = JSON.parse(m.data)['r'+roomId];
    if (room) {
      roomInstance.status.lastPing = Date.now();
      roomInstance.status.cntPing++;
      if (room.e) {
        var ids = getUniqueUserids(room.e);
        roomInstance.postInfo(ids.userIds, ids.forceIds);       
        Kenny.handleEvents(room.e);
        room.e.forEach((evt)=> {
          if(evt.event_type === EventType.UserMentioned) {
            var re =  /^@\w+\s(.+)$/gu;
            var matches = re.exec(evt.content);
            if (matches != null) {
              if (matches.length !== 2) {
                console.log('intruder %s', evt.user_name);
              }else {
                if (roomInstance.roomOwners[evt.user_id] !== undefined) {
                  roomInstance.emit('takecontrol', matches[1]);
                } else {
                  console.log('intruder attempt %s', evt.user_name);
                }
              }
            } else {
              console.log('pinged by %s', evt.user_name);
            }
          }
        });
      }
    } 
  }
  
  function open() {
    console.log('ws open for %s', roomId);
    roomInstance.emit('status',roomInstance.status);
  }
  
  function error(e) {
    console.log('ws error for %s: %s', roomId, e)
  }
  
  function close() {
    console.log('ws close for %s', roomId);
    //Kenny.close();
  }
  
  return {
    message: message,
    open: open,
    error: error,
    close: close,
    room: roomInstance
  }
}

function StartWebSocketListener(url, origin, sh)
{
    var ws = new WebSocket(url, '', {
        perMessageDeflate : true,
        protocolVersion: 13,
        origin: origin
      }), 
      alive = 0,
      timer;
    
    function setAlive() { if (alive > 0) alive--;};
  
    ws.addEventListener('message', setAlive);
    ws.addEventListener('message', sh.message);
    ws.addEventListener('error', sh.error);
    ws.addEventListener('open', sh.open);
    ws.addEventListener('close', sh.close);
    ws.on('close', (c,r) => { 
      console.log('websocket close handling %d',c);
      if (c === 1000) {
        clearInterval(timer);
      }
    });
  
    ws.on('pong', () =>{ console.log('ws pong') });
    ws.on('ping', () =>{ console.log('ws ping') });
    
    timer = setInterval(()=>{
      if (alive > 0) {
        console.warn('websocket not alive for %d seconds', alive * 70 );
      }
      if (alive > 2) {
        console.error('ws not alive');
        
        ws.removeEventListener('message', setAlive);
        ws.removeEventListener('message', sh.message);
        ws.removeEventListener('error', sh.error);
        ws.removeEventListener('open', sh.open);
        ws.removeEventListener('close', sh.close);
        // re-init
        console.log('ws re-init');
        sh.room.postEvents(1).then((ws) => {
          console.info('websocket retry post events', ws);
          sh.room.postWSauth(ws.time, sh).then( () => {
             console.log('ws restarted');    
             clearInterval(timer);
          })
        });
      }
      alive++;
    } ,70*1000);
  
    return ws;
}

exports.StartWebSocketListener = StartWebSocketListener
exports.SocketHandler = SocketHandler