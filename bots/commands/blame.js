const util = require('../util.js');

function Blame(bot) {
  var silent = false, ttw;
  
  function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  
  function pingUser(username) {
    return username !== undefined ? '@' + username.replace(/\s/g,''): 'nobody'
  }
  
  return {
    command : '!!blame', 
    ttw: function() {return ttw},
    events: [1, 2],
    next: function (ce, arg) {
      var u, usr, nextTime;
      if (!silent) {
        var seenUsers = bot.seenUsers(), userlist = [];
        for (u in seenUsers) {
          if (seenUsers.hasOwnProperty(u)) {
            usr = seenUsers[u];
            if (usr.name && usr.cnt) {
              userlist.push( { name: usr.name });
            }
          }
        }
        
        usr = userlist[getRandomArbitrary(0, userlist.length)];
        if (usr !== undefined) {
          bot.send(
            ':' + 
            ce.message_id + 
            ' blames ' + 
            pingUser(usr.name) + 
            ' for ' + 
            ((arg === undefined || (typeof arg === 'string' && arg.length ===0)) ? 'everything': arg));
          nextTime = new Date();
          nextTime.setMinutes(nextTime.getMinutes() + 6);
          ttw = nextTime;
          setTimeout(function () { silent = false; ttw = undefined }, util.minutes(6));
          silent = true;
        }
      }
    }
  };
}

module.exports = Blame;