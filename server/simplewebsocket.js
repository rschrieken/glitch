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
    UserMerged: 30
};


function StartWebSocketListener(url, roomInstance)
{
  
    var ws = new WebSocket(url, '', {
      perMessageDeflate : true,
      protocolVersion: 13,
      origin: roomInstance.getHostname()
    }); 
    var roomId = roomInstance.getRoomId();
    Kenny.init(roomInstance);
  
    function getUniqueUserids(events) {
      var userids = [];
      
      function add(uid) {
        if (uid && userids.indexOf(uid) === -1){
            userids.push(uid);
        }
      }
      
      if (events) {
        events.forEach(function(event){
          switch(event.event_type){
            case EventType.MessagePosted:
            case EventType.MessageEdited:
            case EventType.UserEntered:
              add(event.user_id);
              break;
            default:
              break;
          }
          
        });
      }
      return userids;
    }
  
    ws.addEventListener('message', (m) => {
      roomInstance.emit('tick', Date.now());
      var room = JSON.parse(m.data)['r'+roomId];
      if (room) {
        roomInstance.status.lastPing = Date.now();
        roomInstance.status.cntPing++;
        if (room.e) {
          roomInstance.postInfo(getUniqueUserids(room.e));       
          Kenny.handleEvents(room.e);
        }
      } 
    });
    ws.addEventListener('error', (e)=>{ console.log('ws error for %s: %s', roomId, e) } );
    ws.addEventListener('open', () => { 
      console.log('ws open for %s', roomId);
      roomInstance.emit('status',roomInstance.status);
    });
    ws.addEventListener('close', () => { Kenny.close(); });
    return ws;
}

exports.StartWebSocketListener = StartWebSocketListener