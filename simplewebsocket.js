const WebSocket = require('ws');
const Kenny = require('./kenny-bot.js');

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
            case 3:
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
    ws.addEventListener('open', () => { console.log('ws open for %s', roomId);} );
    ws.addEventListener('close', () => { Kenny.close(); });
    return ws;
}

exports.StartWebSocketListener = StartWebSocketListener