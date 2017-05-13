const util = require('../util.js'); // time utils

// bot is in the intance which gives access to the actual chat bot
function Flush(bot) {
    var i = 0, // keeps state
        ttw;
    return {
      command : '!!flush',  // what the command in chat should be
      ttw: function() {return ttw},
      events: [1,2], // which events, 1 is post, 2 is edit
      next: function (ce) {  // gets called each time the command is requested
        switch (i) {
        case -1:
           console.log('hammered by ', ce.user_name );
          break;
        case 0:
          bot.send(':' + ce.message_id + ' https://www.youtube.com/watch?v=T-3Iq3XQkAw'); // onebox
          i = i + 1;
          break;
        case 1:
          bot.send(':' + ce.message_id + ' https://www.youtube.com/watch?v=Ckw_xK1yVPA'); // onebox
          i = i + 1;
          break;    
        case 2:
          bot.send(':' + ce.message_id + ' https://www.youtube.com/watch?v=JH5ZlSPAXrk'); // onebox
          i = i + 1;
          break;        
        case 3:
          bot.send(':' + ce.message_id + ' https://www.youtube.com/watch?v=Cv9jrGpLYCk'); // onebox
          i = i + 1;
          break;        
        case 4:
          bot.send(':' + ce.message_id + ' https://www.youtube.com/watch?v=KZBRQS5KjWU'); // onebox
          i = i + 1;
          break;        
        case 5:
          ttw = new Date();
          ttw.setMinutes(ttw.getMinutes() + 8);
          setTimeout(function () { i = 0; ttw = undefined }, util.getRandomArbitrary(util.minutes(6), util.minutes(8)));
          i = i + 1;
        default:
          bot.send('you flush your self');
          i = -1;
          break;
        }
      }
  };
}

module.exports = Flush;