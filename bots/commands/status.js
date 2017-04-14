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
    return 'more than 24 hours';
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
        msg = 'BOT running since: ' +  starttime + ' for ' + FormatSeconds(diff/1000) + '\r\nusername (#msg)\r\n';
        for (u in seenUsers) {
          if (seenUsers.hasOwnProperty(u)) {
            usr = seenUsers[u];
            if (usr.name && usr.cnt) {
              msg = msg + usr.name + ' (' +  usr.cnt + ')'  + '\r\n';
            }
          }
        }
        bot.send(msg);
        setTimeout(function () { statussilent = false; }, util.minutes(6));
        statussilent = true;
      }
    }
  };
}

module.exports = Status;