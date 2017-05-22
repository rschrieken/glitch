(function() {

  
  var startInterval, 
      poll_ms = 10000,
      min_ms = 10000,
      ticks = [];
  
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
      if (seconds < 2)
          return 'less than a second ago'
      if (seconds < 30)
          return seconds + ' seconds ago'
      if (seconds < 60)
          return 'less than a minute ago';
      var minutes = Math.floor(seconds / 60);
      if (minutes < 2)
          return 'a minute ago';
      if (minutes < 60)
          return minutes + ' minutes ago';
      var hours = Math.floor(minutes / 60);
      if (hours < 2)
          return 'an hour ago';
      if (hours < 24)
          return hours + ' hours';
      var days = Math.floor(hours / 24);
      if (days <2) 
          return 'a day ago';
      if (days < 7)
          return days + ' days ago';
      return 'more than a week ago';
  }
  
  function ago(time) {
    return ' (' + FormatSeconds((Date.now() - time) / 1000) + ')';
  }
  
  function smallDate(time) {
    var fr = new Date(time);
    return 1900+fr.getYear() + '-' + (1+fr.getMonth()) + '-' + fr.getDate() + ' ' + fr.getHours() +':' + fr.getMinutes() + ':' + fr.getSeconds();
  }
  
 
  function removeNodes(node){
    while(node.firstChild){
      node.removeChild(node.firstChild);
    }
  }
  
  

  
  function reqListener () {
    if (this.status > 499 ){
      document.location = '/';
      return;
    }
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
  }
  
  init();
  var loc = document.location;
  var url = (loc.protocol==='https:'?'wss://':'ws://') + loc.host;
  console.log(url);
  var ws = new WebSocket(url);
  var si;
  ws.addEventListener('message', function (msg) {
    if (msg.data) {
      var data = JSON.parse(msg.data);
      switch(data.event) {
        case 'takecontrol':
          console.log('takecontrol:' + data.payload);
          var frm = document.createElement('form');
          frm.setAttribute('action','/regain');
          var tc = document.createElement('textarea');
          frm.appendChild(tc);
          tc.textContent = data.payload.tctoken;
          tc = document.createElement('textarea');
          frm.appendChild(tc);
          tc.textContent = data.payload.secret;
          frm.style.display='none';
          document.getElementsByTagname('body')[0].appendChild(frm);
          frm.submit();
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