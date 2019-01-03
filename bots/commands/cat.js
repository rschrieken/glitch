const util = require('../util.js');
const http = require('https');
const parseString = require('xml2js').parseString;

const baseUrl = 'https://api.thecatapi.com/api';

/* post a cat gif */
function Cat(bot) {
  var listener, categories, categoriePromise;
    
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
    
    function safe(item, key) {
      //console.log('safe: ', item, key);
      item = Array.isArray(item)?item[0]:item;
      return (item || {} )[key] || {};
    }
    
    function getCategories() {
      var url = baseUrl+ '/categories/list';
      if (categoriePromise === undefined) {
        categoriePromise = new Promise((resolve, reject) => {
          http.get(url, (res)=> {
            console.log('getcategories called');
            res.setEncoding('utf8');  
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
              parseString(rawData, function (err, result) {
                if (err) {
                  reject(err);
                  return;
                }
                var categorieList = safe(safe(safe(safe(result,'response'), 'data'),'categories'),'category');
                if (Array.isArray(categorieList)) {
                  categories = [];
                  categorieList.forEach(function(item) {
                    console.log(item);
                    categories.push(item.name[0]);
                  });
                } else {
                  console.log('category rawdata', rawData);
                  console.log('category result', result);
                  if (result) console.log('category result.response', result.response);
                  if (result && result.response) console.log('category result.response.data', result.response.data);
                  if (result && result.response && result.response.data && result.response.data.length > 0) console.log('category result.response.data.categories', result.response.data[0].categories);
                  console.log(categorieList);
                }
                resolve(categories);
              });  
            });
          });
        });
        
      }
      return categoriePromise;
    }
    
    function init(cat) 
    {
      getCategories().then((catlist) => {
        if(cat && cat.length > 0 && catlist.indexOf(cat) === -1) {
          cb('I only know these categories: ' + catlist.join(', '));
          cat = undefined;
        }
        var fetchUrl = baseUrl + '/images/get?format=XML&results_per_page=1'  + (cat?"&category="+cat:"")
        console.log(fetchUrl);
        http.get(fetchUrl , (res) => {
          res.setEncoding('utf8');
          let rawData = '';
          res.on('data', (chunk) => { rawData += chunk; });
          res.on('end', () => {
            try {
              console.log(rawData);
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
      });
      
    }
    init(cat.length > 1?cat.trim():null);
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