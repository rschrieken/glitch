const util = require('../util.js');

function Thank(bot) {
  var silent = false, ttw;
  
  function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  
  function pingUser(username) {
    return username !== undefined ? '@' + username.replace(' ',''): 'nobody'
  }
  
  function find(usernames , name) {
    for(var i=0; i < usernames.length; i++) {
      console.log('%s===%s', usernames[i], name);
      if (usernames[i].length > 0 && name.indexOf(usernames[i].replace('@','')) === 0) {
        return usernames[i];
      }
    }
    return null;
  }
  
  return {
    command : '!!thank', 
    ttw: function() {return ttw},
    events: [1, 2],
    next: function (ce, arg) {
      var u, usr, nextTime;
      if (!silent && arg.length > 0) {
        
        var seenUsers = bot.seenUsers(), userlist = [], pingers = arg.split(' ');
        console.log('thank ', pingers, typeof arg);
        for (u in seenUsers) {
          if (seenUsers.hasOwnProperty(u)) {
            usr = seenUsers[u];
            if (usr.name && usr.cnt) {
              var validuser = find(pingers, usr.name)
              if (validuser !== null && userlist.indexOf(validuser) === -1) {
                userlist.push( validuser );
              }
            }
          }
        }
        
        // @Mesentery thanks @Sha for the help.
        if (userlist.length > 0) {
            
          bot.send(
            ':' + 
            ce.message_id + 
            ' thanks ' + 
            userlist.join(', ') + 
            ' for the help.');
          nextTime = new Date();
          nextTime.setMinutes(nextTime.getMinutes() + 6);
          ttw = nextTime;
          setTimeout(function () { silent = false; ttw = undefined }, util.minutes(8));
          silent = true;
        }
      }
    }
  };
}

module.exports = Thank;