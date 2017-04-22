const util = require('../util.js'); // time utils

// bot is in the intance which gives access to the actual chat bot
function Flush(bot) {
    var i = 0; // keeps state
    return {
      command : '!!flush',  // what the command in chat should be
      events: [1,2], // which events, 1 is post, 2 is edit
      next: function () {  // gets called each time the command is requested
        switch (i) {
        case 0:
          bot.send('https://www.youtube.com/watch?v=T-3Iq3XQkAw'); // onebox
          i = i + 1;
          break;
        case 1:
          setTimeout(function () { i = 1; }, util.getRandomArbitrary(util.minutes(6), util.minutes(8)));
          i = i + 1;
        default:
          bot.send('you flush your self');
          i = 0;
          break;
        }
      }
  };
}

module.exports = Flush;