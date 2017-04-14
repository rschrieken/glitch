const util = require('../util.js');

/* offer Pee */
function Pee(bot) {
  var cmd = '!!pee', state = 1;

  function stateHandler(ce) {
    switch (state) {
          case 1:
              bot.send('That is gross ....');
              state = 2;
              break;
          case 2:
              bot.send('Open the floodgates ....');
              state = 3;
              break;
          case 3:
              bot.send('Let\'s build some dykes ....');
              state = 4;
              break;
          case 4:
              bot.send('Evacuate the room, woman and children first!');
              state = 5;
              setTimeout(function () { 
                  bot.send('What a mess ...'); 
                },
                util.getRandomArbitrary(util.minutes(1), util.minutes(2)));
              setTimeout(function () { state = 1; }, 
                                util.getRandomArbitrary(util.minutes(6), util.minutes(8)));
              break;
          default:
              // stay quiet
              break;
          }
      }

    return {
      command: cmd,
      events: [1],
      next: stateHandler
    };
}

module.exports = Pee