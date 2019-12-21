const util = require('../util.js');
const http = require('https');
const parseString = require('xml2js').parseString;

const baseUrl = 'https://cataas.com/cat';

/* post a cat gif */
function Cat(bot) {
  var listener, categories, categoriePromise;
  
  function fetchCataas(text, cb) {
    var url = baseUrl;
    if (text && text.length > 0) {
      url += '/' + text;
    }
    bot.uploadImage(url).then((imgurl)=>{
      cb(imgurl);      
    }).catch(()=>{
      cb('a dog chased the cat away');
    });
  }
  
  
  
  function stateHandler(ce, text) {
    var silent = false;
    // handle category
    // http://thecatapi.com/api/categories/list
    if (!silent) {
      fetchCataas(text, function(data){
         if (data ) {
           bot.send(':' + ce.message_id + ' ' + data);
           silent = true;
           setTimeout(function() {
              silent = false;
           }, util.minutes(2));
         }  
      });  
    }
  }

  return {
    events: [1,2],
    command : '!!cat',
    next: stateHandler
  };
}

module.exports = Cat