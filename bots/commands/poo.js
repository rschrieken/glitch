const util = require('../util.js');

/* offer Poo */
function Poo(bot) {
  var cmd = '!!poo', num = 1;

  bot.oncmd.on('wipe', (arg)=>{
    console.log(arg);
    if (arg.state > 1) {
      num = 1;
    }
  });
  
  function stateHandler(ce) {
    var msg = '';
    for(var i=0; i<num; i++) {
      msg += '💩 ';
    }
    bot.send(msg);
    num++;
    if (num>30) num=1;
  }          
  return {
    command: cmd,
    events: [1],
    next: stateHandler
  };
}

module.exports = Poo