const util = require('../util.js');

function Blame(bot) {
  var silent = false;
  
  function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  
  return {
    command : '!!blame',
    events: [1, 2],
    next: function (ce, arg) {
      var u, usr;
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
        
        var usr = userlist[getRandomArbitrary(0, userlist.length)];
        console.log(typeof(arg));
        bot.send(
          ':' + 
          ce.message_id + 
          ' blames @' + 
          usr.name + 
          ' for ' + 
          ((arg === undefined || (typeof arg === 'string' && arg.length ===0)) ? 'everything': arg));
        setTimeout(function () { silent = false; }, util.minutes(6));
        silent = true;
      }
    }
  };
}

module.exports = Blame;