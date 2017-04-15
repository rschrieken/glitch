(function() {
  
  var startInterval, 
      poll_ms = 10000,
      min_ms = 10000;
  
  function adjustPoll() {
    if (poll_ms > min_ms) {
      poll_ms = poll_ms / 2;
      restartPoll();  
    }
  }
  
  // from ShadowWizard
  // https://jsfiddle.net/3w7uh4xt/
  // http://chat.meta.stackexchange.com/transcript/message/5924083#5924083
  function FormatSeconds(seconds) {
      if (seconds <= 0)
          return 'now';
      if (seconds < 60)
          return 'less than a minute';
      var minutes = Math.floor(seconds / 60);
      if (minutes < 2)
          return 'a minute';
      if (minutes < 60)
          return minutes + ' minutes';
      var hours = Math.floor(minutes / 60);
      if (hours < 2)
          return 'an hour';
      if (hours < 24)
          return hours + ' hours';
      return 'more than 24 hours';
  }
  
  function ago(time) {
    return ' (' + FormatSeconds((Date.now() - time) / 1000) + ' ago)';
  }
  
  function smallDate(time) {
    var fr = new Date(time);
    return 1900+fr.getYear() + '-' + (1+fr.getMonth()) + '-' + fr.getDate() + ' ' + fr.getHours() +':' + fr.getMinutes() + ':' + fr.getSeconds();
  }
  
  function refreshRow(partid, time, count) {
    document.getElementById(partid).textContent = smallDate(time);
    var _human = document.getElementById(partid + '_human');
    _human.textContent = ago(time);
    _human.setAttribute('data-time',time);
    var _count = document.getElementById(partid + '_count');
    _count.textContent = count;
  }
  
  function removeNodes(node){
    while(node.firstChild){
      node.removeChild(node.firstChild);
    }
  }
  
  function createCommandLi(cmd){
    var li = document.createElement('li');
    li.textContent = cmd;
    return li;
  }
  
  function refreshCommands(cmds) {
    var i, ul;
    if (cmds && cmds.length && cmds.length > 0) {
      ul = document.getElementById('cmds');
      removeNodes(ul);
      for(i = 0; i < cmds.length; i = i + 1) {
        ul.appendChild(createCommandLi(cmds[i].command));
      }
    }
  }
  
  function refreshStatus(status) {
    refreshRow('ping', status.lastPing, status.cntPing );
    refreshRow('msg', status.lastMessage, status.cntMessage);
    refreshCommands(status.commands);
  }
  
  function refreshTick(time) {
    var tick = document.getElementById('tick');
    tick.textContent = ago(time);
    tick.setAttribute('data-time',time);
  }
  
  function reqListener () {
    if (this.status > 499 ){
      document.location = '/';
      return;
    }
    var status = JSON.parse(this.responseText);
    refreshStatus(status);
    adjustPoll();
  }

  function reqError(){
    if (this.status !== 418) {
      document.location = '/';
    }
  }

  function restartPoll() {
    clearInterval(startInterval) ;
    init();
  }
  
  function reqTimeout() {
    poll_ms = poll_ms * 2;
    restartPoll();
  }

  function init(){
    startInterval = setInterval( function() {
      var oReq = new XMLHttpRequest();
      oReq.addEventListener("load", reqListener);
      oReq.addEventListener("error", reqError);
      oReq.addEventListener("timeout", reqTimeout);
      oReq.open("GET", "/status?_t="+Date.now());
      oReq.send();
    }, poll_ms);
    setInterval(function() {
      var coll = document.getElementsByClassName('relativetime');
      for(var elem in coll) {
        if (coll.hasOwnProperty(elem)) {
          var e = coll[elem];
          var time = e.getAttribute('data-time');
          if (time) {
            time = parseInt(time, 10);
            if (!Number.isNaN(time)) {
              e.textContent = ago(time);
            }
          }
        }
      };
    }, 10000);
  }
  
  init();
  var loc = document.location;
  var url = 'wss://' + loc.hostname;
  console.log(url);
  var ws = new WebSocket(url);
  var si;
  ws.addEventListener('message', function (msg) {
    if (msg.data) {
      var data = JSON.parse(msg.data);
      switch(data.event) {
        case 'action':
          var doc = document.getElementById('action');
          doc.textContent = data.payload;
          break;
        case 'status':
          refreshStatus(data.payload);
          clearInterval(startInterval);
          break;
        case 'tick':
          refreshTick(data.payload);
          break;
      }
    }
  });
  ws.addEventListener('open', function (msg) {
    ws.send('started');
    si = setInterval(function() {
      ws.send(Date.now());
    }, 59000); 
  });
  
  
})()