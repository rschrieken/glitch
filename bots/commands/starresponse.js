const util = require('../util.js');

/*detect starring a message */
/* star and unstar is the same event
 so it toggles for a certain message and certain user
*/
function StarResponse(bot) {
  var seen = [], backoffFirst = false, backoffSecond = false;
  return {
    events: [6],
        next: function (ce) {
      var idx = seen[ce.message_id];
      if (idx === undefined) {
        if (!backoffFirst) {
          bot.send('Not everything is star-worthy...');
          backoffFirst = true;
          setTimeout(function () { backoffFirst = false; }, util.minutes(60));
        }

        seen[ce.message_id] = [];
        seen[ce.message_id][ce.user_id] = true;

      } else {
        if (idx[ce.user_id] === true) {
          idx[ce.user_id]	= false;
          if (!backoffSecond) {
            bot.send('Stars get removed under peer-pressure?');
            backoffSecond = true;
            setTimeout(function () { backoffSecond = false; }, util.minutes(60));
          }
        } else {
          seen[ce.message_id][ce.user_id] = true;
        }
      }
    }
  };
}

module.exports = StarResponse;