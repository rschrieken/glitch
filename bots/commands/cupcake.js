const util = require('../util.js');
/* offer cupcakes */
function Cupcake(bot) {
  var cmd = '!!cupcake', last, state = 1;
  return {
    command: cmd,
    events: [1],
    next: function (ce) {
      switch (state) {
      case 1:
        bot.send('One cupcake on its way for @' + ce.user_name.replace(' ','') + ' ....');
        bot.send(':' + ce.message_id + ' http://i.stack.imgur.com/87OMls.jpg', 25);
        last = Date.now();
        state = 2;
        break;
      case 2:
        if (((Date.now() - last) < util.minutes(10))) {
          bot.send('Out of dough...');
        } else {
          bot.send('Don\'t hammer me...');
        }
        state = 3;
        break;
      case 3:
        bot.send('new cupcakes can be ordered in 6 to 8 minutes...', 5, 30);
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

module.exports = Cupcake;