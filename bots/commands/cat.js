const util = require('../util.js');
const http = require('http');
const parseString = require('xml2js').parseString;

/* post a cat gif */
function Cat(bot) {
  var listener;
    
  function fetchCatXml(cat, cb) {
    
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
    
    var fetchUrl = "http://thecatapi.com/api/images/get?format=XML&results_per_page=1" + (cat.length > 1 ?"&category="+cat:"")
    console.log(fetchUrl);
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
                const regex = /^(http|https):\/\/(\d+)\..*/gi;
                var match = regex.exec(caturl);
                if (match !== null && match.length === 3 ) {
                  var key = Number.parseInt(match[2],10);
                  if (key !== NaN && key > 25) {
                    caturl = caturl.replace(match[1] + ':\/\/' + match[2], match[1] + ':\/\/25' )
                  }
                }
                cb(caturl);  
              }
              
            });
            
        } catch (e) {
          console.error(e.message);
          cb('cat in parse error');
        }
      });
    }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
      cb('cat in error');
    });
  }
  
  function stateHandler(ce, category) {
    var silent = false;
    // handle category
    // http://thecatapi.com/api/categories/list
    if (!silent) {
      fetchCatXml(category, function(data){
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