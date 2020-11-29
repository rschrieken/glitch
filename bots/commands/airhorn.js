const util = require('../util.js'); // time utils
const https = require('https');
const parseString = require('xml2js').parseString;


// use rss feed  
const url = 'https://www.youtube.com/feeds/videos.xml?playlist_id=UU8TlJDFKxci1RrcRD1eCd7g';

// bot is in the instance which gives access to the actual chat bot
function Airhorn(bot) {
    var i = 0, // keeps state
        ttw,
        channel;
  
    function getFeed(feedurl) {
      function executor(resolve, reject) {
        https.get(feedurl , (res) => {
          var rss='';
          res.on('data', (d) => {
           rss = rss + d;
          });
          res.on('error', (error) => {
            console.log('https yt error', res);
            reject(error);
          });
          res.on('end', (d) => {
            console.log('end');
            parseString(rss, (err, result) => {
              if (err)  {
                console.log(err);
                reject(err);
              } else {
                var entries = [];
                if (result && result.feed && result.feed.entry) {
                  for(var i = 0; i < result.feed.entry.length; i = i + 1) {
                    if(result.feed.entry[i]['yt:videoId']) {
                      entries.push(result.feed.entry[i]['yt:videoId'][0]);
                    }
                  }
                }
                setInterval(function() { channel = getFeed(url); }, (entries.length + 1) * 60 * 60 * 1000); // once every length of entries hours
                resolve(entries);
              }
            })
          });
        }).on('error', (err)=>{ console.error('yt https err', err); reject(err);});
      }
      return new Promise(executor);
    }
  
    channel = getFeed(url);
  
    return {
      command : '!!airhorn',  // what the command in chat should be
      ttw: function() {return ttw},
      events: [1,2], // which events, 1 is post, 2 is edit
      next: function (ce) {  // gets called each time the command is requested
        switch (i) {
        case -1:
           console.log('hammered by ', ce.user_name );
          break;
        case 0:
           channel.then((feeds) => {
            if(feeds && feeds.length > 0) {
              bot.send(':' + ce.message_id + ' https://www.youtube.com/watch?v=' + feeds[util.getRandomMax(feeds.length)] ); // onebox   
            } else {
              bot.send('Honk!'); // onebox   
            }
          })
          .catch((e)=>{
            console.error('errr ' , e);
            bot.send('you broke the flush!');  
          });
          i = i + 1;
          break;
        case 1:
          ttw = new Date();
          ttw.setMinutes(ttw.getMinutes() + 8);
          setTimeout(function () { i = 0; ttw = undefined }, util.getRandomArbitrary(util.minutes(6), util.minutes(8)));
          i = i + 1;
        default:
          bot.send('Beep!');
          i = -1;
          break;
        }
      }
  };
}

module.exports = Airhorn;