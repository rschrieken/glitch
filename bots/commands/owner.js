/* these commands are for the owner that runs them*/
function Owner(bot) {
  return {
    isOwner: true,
    extend: function (extra) {
      for(var f in extra) {
        if (extra.hasOwnProperty(f)) {
          bot[f] = extra[f];
        }
      }
    },
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
      //console.log('own cnt',ce.content);
      if (ce.content && ce.content.indexOf('!!block') === 0) {
        var args = ce.content.split(' ');
        bot.blockUser(args[1]);
        //console.log('own block args', args);
        handled = true;
      }
      if (ce.content && ce.content.indexOf('!!unblock') === 0) {
        var args = ce.content.split(' ');
        bot.unblockUser(args[1]);
        handled = true;
      }
      return handled;
    }
  }
}

module.exports = Owner;