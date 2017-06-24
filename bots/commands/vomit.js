function Vomit(bot) {
  var i = 0;
  
   bot.oncmd.on('feed', (arg)=>{
    console.log(arg);
    i = arg.count;
  });
  
    return {
      command : '!!vomit',
      events: [1,2],
      next: function () {
        if (i > 2) {
          bot.oncmd.emit('vomit', {state: i});
        } else {
          bot.send('Is there anything left?');
        }
      }
  };
}

module.exports = Vomit;