const util = require('../util.js');
const http = require('https');
const parseString = require('xml2js').parseString;

const baseUrl = 'https://cataas.com/cat';

/* post a cat gif */
function Cat(bot) {
  var listener, categories, categoriePromise;
  
  function buildPath(tag, say) {
    var parts =[];
    if (tag.length > 0) {
      parts.push(tag);
    }
    if (say.length > 0) {
      parts.push('says');
      parts.push(say);
    }
    return '/' + parts.join('/');
  }
  
  function dummy () {}
  
  function fetchCataas(text, cb) {
    var url = baseUrl, tag, say, clean, quoteEnd, quoteStart;
    if (text && text.length > 0) {
      clean =  text.trim();
      //parsing etc
      quoteStart = clean.indexOf('"');
      if (quoteStart > -1) {
        quoteEnd = clean.indexOf('"', quoteStart +1);
        if (quoteEnd > 0) {
          say = clean.substring(quoteStart + 1, quoteEnd);
        }
        tag = clean.substring(0, quoteStart-1);
      } else {
        tag = clean;
      }
      url += buildPath(tag,say);
    }
    console.log('cataas: ', url)
    bot.uploadImage(url).then((imgurl)=>{
      if (imgurl !== null) {
        cb(imgurl);      
      } else {
        cb('no  cats available');
      }
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