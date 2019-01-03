const util = require('../util.js');
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
        return 'a minute ago';
    if (minutes < 60)
        return minutes + ' minutes';
    var hours = Math.floor(minutes / 60);
    if (hours < 2)
        return 'an hour';
    if (hours < 24)
        return hours + ' hours';
    var days = Math.floor(hours / 24);
    if (days < 366)
        return days + ' days';
    return 'more than an year';
}

function Status(bot) {
  var msg, statussilent = false, ttw;
  
  function statusHeader() {
    var starttime = new Date();
     starttime.setTime(bot.started);
    var now = new Date(); 
    var diff = now.getTime() - bot.started;
    return '    BOT running since: ' +  starttime + ' for ' + FormatSeconds(diff/1000) + '\r\n    ';
  }
  
  function createList2(seenUsers) {
    var u, usr, statList = [];
    for (u in seenUsers) {
        if (seenUsers.hasOwnProperty(u)) {
          usr = seenUsers[u];
          if (usr.name && usr.cnt) {
            // maxusername = usr.name.length > maxusername ? usr.name.length : maxusername;
            statList.push( { name: usr.name, cnt: usr.cnt, last_seen: usr.last_seen, totalcnt: usr.totalcnt });
          }
        }
      }
    return statList;
  }
  
  function createList(seenUsers) {
    var u, usr, statList = [];
    for (u in seenUsers) {
        if (seenUsers.hasOwnProperty(u)) {
          usr = seenUsers[u];
          console.log(usr);
          if (usr.name && usr.cnt) {
            // maxusername = usr.name.length > maxusername ? usr.name.length : maxusername;
            statList.push( { name: usr.name, cnt: usr.cnt, last_seen: usr.last_seen });
          }
        }
      }
    return statList;
  }
  
  function getMaxUsername(list) {
    var max = 0;
    list.forEach(function(usr) {
       max = usr.name.length > max ? usr.name.length : max;
    });
    return max;
  }
  
  function spaces(max) {
     var padding = '';
     while(max-- > 0) {
       padding += ' ';
     }
     return padding;
  }
  
  function userComparer(a,b) {
    return a.cnt < b.cnt ? 1 : a.cnt > b.cnt ? -1 : a.name < b.name ? -1: a.name > b.name ?  1: 0;
  }
  
  function buildStatusLine(stat, padding, maxusername) {
    var ls = new Date(stat.last_seen * 1000);
    var now = new Date(); 
    var diff = now.getTime() - ls.getTime();
    return (stat.name + padding).substring(0,maxusername) + 
      ', seen ' + 
      FormatSeconds(diff/1000) +
      ' ago (' +  
      stat.cnt + 
      ')'  + 
      '\r\n    ';  
  }
  
  function buildStatusLine2(stat, padding, maxusername) {
    var ls = new Date(stat.last_seen);
    var now = new Date(); 
    var diff = now.getTime() - ls.getTime();
    return (stat.name + padding).substring(0,maxusername) + 
      ', seen ' + 
      FormatSeconds(diff/1000) +
      ' ago (' +  
      stat.cnt + 
      ' / ' + 
      stat.totalcnt +
      ')'  + 
      '\r\n    ';  
  }
  
  function executeThrottle() {
      ttw = new Date();
      ttw.setMinutes(ttw.getMinutes() + 6);
      setTimeout(function () { statussilent = false; }, util.minutes(6));
      statussilent = true;
  }
  
  function statusV2() {
    if (!statussilent) {
     
      bot.allSeenUsers().then(function(userlist) {
        var statList = createList2(userlist);
        var maxusername = getMaxUsername(statList);

        var padding = spaces(maxusername);

        msg = statusHeader();
        msg += ('username'+ padding).substring(0,maxusername) + '  (#msg (curr/tot))\r\n    ';

        statList.sort(userComparer).forEach(function(stat){
           msg = msg + buildStatusLine2(stat, padding, maxusername);
        });

        bot.send(msg);
      }).catch(function(){
        console.error('allSeenusers faled');
      });
      
      executeThrottle();
    }
  }
  
  function statusV1() {
    if (!statussilent) {
            
      var statList = createList(bot.seenUsers());
      var maxusername = getMaxUsername(statList);
      
      var padding = spaces(maxusername);
      
      msg = statusHeader();
      msg += ('username'+ padding).substring(0,maxusername) + '  (#msg)\r\n    ';
      
      statList.sort(userComparer).forEach(function(stat){
         msg = msg + buildStatusLine(stat, padding, maxusername);
      });

      bot.send(msg);
      
      executeThrottle();
    }
  }
  
  return {
    command : '!!status',
    ttw: function() {return ttw},
    events: [1],
    next: statusV2
  };
}

module.exports = Status;