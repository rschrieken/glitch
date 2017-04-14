/* these commands are for the owner that runs them*/
function Owner(bot) {
  return {
    isOwner: true,
    next: function(ce) {
      var handled = false;
      if (ce.content === '!!time') {
        bot.send(new Date().toString());
        handled = true;
      }
      if (ce.content === '!!stop') {
        bot.send('...');
        bot.silence(true);
        handled = true;
      }
      if (ce.content === '!!go') {
        bot.silence(false);
        handled = true;
      }
      return handled;
    }
  }
}

module.exports = Owner;