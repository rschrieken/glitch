const util = require('../util.js');

/*detect starring a message */
/* star and unstar is the same event
 so it toggles for a certain message and certain user
*/
function StarResponse(bot) {
  var seen = {}, backoffFirst = false, backoffSecond = false;
  return {
    events: [6],
    next: function (ce) {
      var key = 'msg' + ce.message_id,
          userkey = 'user' + ce.user_id,
          idx = seen[key];
      if (idx === undefined) {
        if (!backoffFirst) {
          bot.send('Not [everything](' + bot.getHostname() + '/transcript/message/' + ce.message_id + ') is star-worthy...');
          backoffFirst = true;
          setTimeout(function () { backoffFirst = false; }, util.minutes(60));
        }

        seen[key] = {};
        seen[key][userkey] = true;

      } else {
        if (idx[userkey] === true) {
          idx[userkey]	= false;
          if (!backoffSecond) {
            bot.send('Stars get removed under peer-pressure?');
            backoffSecond = true;
            setTimeout(function () { backoffSecond = false; }, util.minutes(60));
          }
        } else {
          seen[key][userkey] = true;
        }
      }
    }
  };
}

module.exports = StarResponse;