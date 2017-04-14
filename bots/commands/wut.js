function Wut(bot) {
    var i = 0;
    return {
      isUnknown: true,
      command : '!!wut',
      events: [1],
      next: function () {
        switch (i) {
        case 0:
          bot.send('WUT?');
          i = i + 1;
          break;
        case 1:
          bot.send('What are you talking about?');
          i = i + 1;
          break;
        case 2:
          bot.send('Maybe lookup my instructions?');
          i = i + 1;
          break;
        default:
          bot.send('That is all gibberish to me...');
          i = 0;
          break;
        }
      }
  };
}

module.exports = Wut;