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
  var msg, statussilent = false;
  return {
    command : '!!status',
    events: [1],
    next: function () {
      var u, usr;
      if (!statussilent) {
        var starttime = new Date();
        var seenUsers = bot.seenUsers();
       
        starttime.setTime(bot.started);
        var now = new Date(); 
        var diff = now.getTime() - bot.started;
        msg = '    BOT running since: ' +  starttime + ' for ' + FormatSeconds(diff/1000) + '\r\n    ';
        var statList = [], maxusername = 0;
        for (u in seenUsers) {
          if (seenUsers.hasOwnProperty(u)) {
            usr = seenUsers[u];
            if (usr.name && usr.cnt) {
              maxusername = usr.name.length > maxusername ? usr.name.length : maxusername;
              statList.push( { name: usr.name, cnt: usr.cnt });
            }
          }
        }
        var padding = '';
        for(var p=0;p<maxusername;p++) {
          padding += ' ';
        }
        msg += ('username'+ padding).substring(0,maxusername) + '  (#msg)\r\n    ';
        statList.sort( function(a, b) {
          return a.cnt < b.cnt ? 1 : a.cnt > b.cnt ? -1 : a.name < b.name ? -1: a.name > b.name ?  1: 0;
        }).forEach(function(stat){
           msg = msg + (stat.name + padding).substring(0,maxusername) + '  (' +  stat.cnt + ')'  + '\r\n    ';  
        });
        
        bot.send(msg);
        setTimeout(function () { statussilent = false; }, util.minutes(6));
        statussilent = true;
      }
    }
  };
}

module.exports = Status;