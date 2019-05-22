const util = require('../util.js');
const parser = require('../../utils/htmlparser.js');

const allExcludedUsers = {
        "https://chat.meta.stackexchange.com" : {
          // the den
          "721": {
             "377214": true, // sonic
          },
          // sandbox
          "1196": {
             "152859": true, // shadowwizard
             "158100": true, // rene
          }
        }
      };


function Blame(bot) {
  var silent = false, ttw;  
  console.log('blame',bot.getHostname());
  var exclusions = allExcludedUsers[bot.getHostname()] || {};
  console.log('blame excl',exclusions);
  
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
      var u, usr, nextTime, excludedUsers = exclusions[ce.room_id] || {};
      console.log('blame next ', excludedUsers, ce, ce.room_id);
      if (!silent) {
        var seenUsers = bot.seenUsers(), userlist = [];
        for (u in seenUsers) {
          if (seenUsers.hasOwnProperty(u)) {
            usr = seenUsers[u];
            console.log('balme seen ', usr.id, excludedUsers[usr.id]);
            if (usr.name && 
                usr.cnt && 
                usr.is_moderator === false) {
              if (excludedUsers[usr.id] === true) {
                console.log('explicitly excluded ', usr.id, excludedUsers[usr.id]);
              } else {
                console.log('added ', usr.id, excludedUsers[usr.id]);
                userlist.push( { name: usr.name });
              }
            } else {
              console.log('skipped ', usr.id, excludedUsers[usr.id]);
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
            ((arg === undefined || (typeof arg === 'string' && arg.length ===0)) ? 'everything': parser.cleanInput(arg)));
          nextTime = new Date();
          nextTime.setMinutes(nextTime.getMinutes() + 1);
          ttw = nextTime;
          setTimeout(function () { silent = false; ttw = undefined }, util.minutes(1));
          silent = true;
        }
      }
    }
  };
}

module.exports = Blame;