const util = require('../util.js');
const http = require('https');
const parseString = require('xml2js').parseString;

const baseUrl = 'https://cataas.com/cat';

/* post a cat gif */
function Cat(bot) {
  var listener, categories, categoriePromise;
  
  function hasValue(str) {
      return (str && typeof str === 'string' && str.length > 0)
    }
  
  function buildPath(tag, say) { 
    
    var parts =[];
    if (hasValue(tag)) {
      parts.push(tag);
    }
    if (hasValue(say)) {
      parts.push('says');
      parts.push(say);
    }
    return '/' + parts.join('/');
  }
  
  function firstWord (str) {
    var word;
    if (hasValue(str)) {
      word = str.split(' ')[0];
    } else {
      word = '';
    }
    return word;
  }
  
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
        } else {
          say = clean.substring(quoteStart + 1, clean.length);
        }
        tag = firstWord(clean.substring(0, quoteStart-1));
      } else {
        tag = firstWord(clean);
      }
      url += buildPath(tag,say);
    }
    console.log('cataas: ', url)
    bot.uploadImage(url).then((imgurl)=>{
      if (imgurl !== null) {
        cb(imgurl);      
      } else {
        cb('no cats available');
      }
    }).catch(()=>{
      cb('a dog chased the cat away');
    });
  }
  
  
  var waitResponses = ['looking for cats ...', 'now where did I put those pictures ...','wait for it ...','meow meow meow ...'];
  
  function stateHandler(ce, text) {
    var silent = false;
    // handle category
    // http://thecatapi.com/api/categories/list
    if (!silent) {
      bot.send(waitResponses[Math.floor(Math.random()*waitResponses.length)]);
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
    usage: '[category] ["text"]',
    next: stateHandler
  };
}

module.exports = Cat