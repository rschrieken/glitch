const util = require('../util.js')

/* offer coffee */
function Coffee(bot) {
    var  state = 1, timeout;

  function reset(toState, time) {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(function () { state = toState; }, time);
  }

  return {
    command : '!!coffee',
    events: [1],
        next: function () {
          switch (state) {
          case 1:
            bot.send('418 I\'m a TEAPOT');
            reset(3, util.minutes(1));
            state = 2;
            break;
          case 2:
            bot.send('406 Not Acceptable');
            state = 3;
            reset(4, util.minutes(10));
            break;
          case 3:
            bot.send('Too much coffee is bad....');
                reset(4, util.minutes(5));
            state = 6;
            break;
          case 4:
            bot.send('Refilling...');
            reset(1, util.seconds(10));
            state = 6;
            break;
          default:
            break;
          }
        }
    };
}

module.exports = Coffee;