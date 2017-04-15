//  https://i.stack.imgur.com/LpgOW.jpg

function Wipe(bot) {
    var i = 0;
    return {
      command : '!!wipe',
      events: [1],
      next: function () {
        switch (i) {
        case 0:
          bot.send('https://i.stack.imgur.com/LpgOW.jpg');
          i = i + 1;
          break;
        case 1:
          bot.send('You clean up your own mess');
          i = i + 1;
          break;
        case 2:
          bot.send('https://lifehacks.stackexchange.com');
          i = i + 1;
          break;
        default:
          bot.send('I\'m not your mother');
          i = 0;
          break;
        }
      }
  };
}

module.exports = Wipe;