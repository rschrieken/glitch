const util = require('../util.js');
const http = require('http');


/* last message tracker */
function LastMessage(bot) {
  var listener,
      url=['http://www.omdbapi.com/?t=shadow&y=',
           'http://www.omdbapi.com/?t=wizard&y='],
      urlCurrent = 0,
      minutesToNext = 60,
      minutesLow = 60,
      skip = false;

  function resetTimer(noreset) {
    clearTimeout(listener);
    listener = setTimeout(sendRandomWord, util.minutes(minutesToNext));  
    if (noreset) {
      skip = true;
      return;
    }
    if (skip) {
      skip = false;
    } else {
      if (minutesToNext > minutesLow) minutesToNext = minutesToNext / 2;
    }
  }
  
  function fetchOmdbJson(cb) {
    var year = new Date().getFullYear() - 1900;
    http.get(url[urlCurrent] + (1900 + Math.floor(Math.random() * year)), (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      urlCurrent++ % url.length;
      
      let error;
      var fetchPayload = false;
      if (statusCode !== 200) {
        error = new Error(`Request Failed.\n` +
                          `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error(`Invalid content-type.\n` +
                          `Expected application/json but received ${contentType}`);
        fetchPayload = true;
      }
      if (error) {
        console.error(error.message);
        // consume response data to free up memory
        if (!fetchPayload){
          res.resume();
          cb({});
          return;
        }
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          if (fetchPayload) {
            console.log(rawData);
            cb({});
          } else {
            const parsedData = JSON.parse(rawData);
            //console.log(parsedData);
            cb(parsedData)
          }
        } catch (e) {
          console.error(e.message);
        }
      });
    }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
      cb({});
    });
  }
  
  function sendRandomWord(final) {
    
    function restart() {
      minutesToNext = minutesToNext * 2;
      resetTimer(true);  
    }
    
    fetchOmdbJson(function(data){
       if (data && data.Response && data.Response === 'True' && data.Title) {
         bot.send(data.Title);
         restart();
       } else {
         if (final) {
           bot.send('Where is everybody!?!');
           restart();
         } else {
           setTimeout(function() {
              sendRandomWord(true);
           }, util.minutes(1));
         }  
       }
    });
    
  }
  
  function stateHandler(ce) {
    resetTimer();
  }
  
  resetTimer();

  return {
    events: [1],
    next: stateHandler
  };
}

module.exports = LastMessage