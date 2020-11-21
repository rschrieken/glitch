const util = require('../util.js');
const http = require('http');
const apikey = process.env.OMDBAPIKEY;

const yt = ['https://www.youtube.com/watch?v=e2vBLd5Egnk','https://www.youtube.com/watch?v=CBdQYwpj7VU','https://www.youtube.com/watch?v=O7vHqm9HcXc','https://www.youtube.com/watch?v=1Cw1ng75KP0'];

var ytIndex = 0;

function getYouTube() {
  var msg = '[I\'m a little bit lonely...](' + yt[ytIndex] + ')';
  ytIndex++;
  ytIndex = (ytIndex % yt.length);
  return msg;
}

/* last message tracker */
function LastMessage(bot) {
  var listener,
      url=['http://www.omdbapi.com/?apikey=' + apikey + '&t=shadow&y=',
           'http://www.omdbapi.com/?apikey=' + apikey + '&t=wizard&y=',
           'http://www.omdbapi.com/?apikey=' + apikey + '&t=obscurity&y=',
           'http://www.omdbapi.com/?apikey=' + apikey + '&t=shade&y=',
           'http://www.omdbapi.com/?apikey=' + apikey + '&t=dimness&y=',
           'http://www.omdbapi.com/?apikey=' + apikey + '&t=magician&y=',
           'http://www.omdbapi.com/?apikey=' + apikey + '&t=shaman&y=',
           'http://www.omdbapi.com/?apikey=' + apikey + '&t=warlock&y='],
      fallback =[
        'Where is everybody!?!',
        'Can\'t we be a bit moar talkative?',
        getYouTube,
        'Echo ... E c h o  ...... E   c  h   o .....',
        'What is this? Weekend?',
        'Who needs sleep here?',
        'A few more hours and this room will be frozen ...'
      ],
      previousTitle,
      urlCurrent = 0,
      fallbackCurrent = 0,
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
    var fetchUrl = url[urlCurrent] + (1900 + Math.floor(Math.random() * year));
    console.log('%s urlCurrent: %d , fetchUrl: %s', new Date(), urlCurrent, fetchUrl);
    http.get(fetchUrl , (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      urlCurrent++;
      urlCurrent = ( urlCurrent % url.length);
      
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
            //console.log(rawData);
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
       if (data && data.Response && data.Response === 'True' && data.Title && data.Title !== previousTitle) {
         bot.send(data.Title);
         previousTitle = data.Title;
         restart();
       } else {
         if (final) {
           var anyfallback = fallback[fallbackCurrent];
           if (typeof anyfallback === 'function') {
             anyfallback = anyfallback();
           }
           bot.send(anyfallback);
           fallbackCurrent++;
           fallbackCurrent = (fallbackCurrent % fallback.length);
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