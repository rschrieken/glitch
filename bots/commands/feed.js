const util = require('../util.js');

function Feed(bot) {
  var silent = false, 
      ttw, 
      food = [],
      resp = [
        'I bloody hope {0} is edible ...',
        'I\'m not sure I ever had {0} ...',
        'The taste of {0} is awful but it\'s better than nothing ..',
        'Thanks for the {0}, appreciated!'
      ];
  
  bot.oncmd.on('vomit', (arg)=>{
    var cnt = util.getRandomArbitrary(0, food.length / 2), 
        item,
        items = '';
    while(cnt > 0) {
      item = food.shift();
      if (item !== undefined) {
        items = items + item + ', ';
      } else {
        break;
      }
      cnt--;
    }
    if (items.length > 3) {
      bot.send('BLLLEEEAAAAEERRRGGGGGJHHHHHH ' + items.substring(0,items.length-2) +' !!!!!');
    }
  });
  
  return {
    command : '!!feed', 
    //ttw: function() {return ttw},
    events: [1, 2],
    next: function (ce, arg) {
      var txtResp, formattedResp, idx;
          
      if (arg.length === 0) {
        bot.send(':' + 
            ce.message_id + 
            ' thanks for trying to feed me, but I can\'t live on nothing');
      } else {
        bot.oncmd.emit('feed', {count: food.length});
        if (food.length < 10) {
          idx = Math.floor(util.getRandomArbitrary(0, resp.length));
          console.log(idx);
          txtResp = resp[idx];
          console.log(txtResp);
          formattedResp = txtResp.replace('{0}',arg);
          food.push(arg);
        } else {
          formattedResp = 'I have had enough for now ...'
        }
        bot.send(formattedResp);
      }
    }
  };
}

module.exports = Feed;