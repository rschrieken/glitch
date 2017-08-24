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
  return {
    command : '!!status',
    ttw: function() {return ttw},
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
            console.log(usr);
            if (usr.name && usr.cnt) {
              maxusername = usr.name.length > maxusername ? usr.name.length : maxusername;
              statList.push( { name: usr.name, cnt: usr.cnt, last_seen: usr.last_seen });
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
           var ls = new Date(stat.last_seen * 1000);
           var now = new Date(); 
           var diff = now.getTime() - ls.getTime();
           msg = msg + (stat.name + padding).substring(0,maxusername) + ', seen ' + FormatSeconds(diff/1000)  +' ago (' +  stat.cnt + ')'  + '\r\n    ';  
        });
        
        bot.send(msg);
         ttw = new Date();
        ttw.setMinutes(ttw.getMinutes() + 6);
        setTimeout(function () { statussilent = false; }, util.minutes(6));
        statussilent = true;
      }
    }
  };
}

module.exports = Status;