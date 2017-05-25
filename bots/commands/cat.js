const util = require('../util.js');
const http = require('http');
const parseString = require('xml2js').parseString;

/* last message tracker */
function Cat(bot) {
  var listener;
    
  function fetchCatXml(cb) {
    
    function findUrl(item) {
      if (item === undefined || item === null ) {
        return "";
      }
      if (typeof item === 'string') {
        return item;
      }
      if (Array.isArray(item)) {
        return findUrl(item[0]);
      }
      var key;
      ['response','data', 'images','image','url'].forEach(function(v){
        if (item[v]) {key = v;}
      });
      if (key !== undefined) return findUrl(item[key]);
      console.log('out findurl ', item);
      return "no cats today";
    }
    
    var fetchUrl = "http://thecatapi.com/api/images/get?format=XML&results_per_page=1";
    http.get(fetchUrl , (res) => {
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
            parseString(rawData, function (err, result) {
              if (err) {
                console.log(err);
              } else {
                var caturl = findUrl(result);
                cb(caturl);  
              }
              
            });
            
        } catch (e) {
          console.error(e.message);
        }
      });
    }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
      cb({});
    });
  }
  
  function stateHandler(ce) {
    var silent = false;
    if (!silent) {
      fetchCatXml(function(data){
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