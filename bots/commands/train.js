const Entities = require('html-entities').AllHtmlEntities;
 
const entities = new Entities();

/*detect a Train... */
function TrainState(bot) {
    var last, lastcnt = 0;
    return {
      events: [1],
      next: function (ce) {
        var decoded;
        if (last !== ce.content) {
          last = ce.content;
          lastcnt = 0;
        } else {
          lastcnt = lastcnt + 1;
          if (lastcnt === 3) {
            decoded = entities.decode(decodeURIComponent(last));
            bot.send(decoded);
          }
       }
    }
  };
}

module.exports = TrainState