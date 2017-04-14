const util = require('../util.js');

/* offer Milk */
function Milk(bot) {
  var cmd = '!!milk', last, state = 1;
  return {
    command: cmd,
    events: [1],
    next: function (ce) {
      switch (state) {
      case 1:
        bot.send('I\'m milking the cow ....');
        last = Date.now();
        state = 2;
        break;
      case 2:
        if (((Date.now() - last) < util.minutes(2))) {
          bot.send('The cow kicked the bucket... try later');
        } else {
          bot.send('I\'m skimming the milk... try later');
        }
        state = 4;
        setTimeout(function () { state = 3; }, util.getRandomArbitrary(util.minutes(6), util.minutes(8)));
        break;
      case 3:
        bot.send('Have your raw milk');
        bot.send(':' + ce.message_id + ' http://i.imgur.com/99jt9Xx.gif');
        setTimeout(function () { state = 1; }, util.getRandomArbitrary(util.minutes(6), util.minutes(8)));
        state = 4;
        break;
      default:
        // stay quiet
        break;
      }
    }
  };
}

module.exports = Milk;