const util = require('../util.js');
const http = require('https');
const htmlparser = require('htmlparser2');

const db = require('better-sqlite3')('.data/wag.db');

db.exec('CREATE TABLE IF NOT EXISTS blocklist(id integer primary key, word TEXT)');

const stmt = db.prepare('SELECT id FROM blocklist where word = ?');

//const blacklist = JSON.parse(Buffer.from('WyJuaWdnZXIiLCJmdWNrIl0=', 'base64').toString());

function WordParser(res) {
  var state = 0, words =[];

  function executor(resolve, reject) {
    var parser = new htmlparser.Parser(
       {
         onopentag: function(tagname, attr) {
           //console.log(tagname, attr, state);
           if (state === 0 && tagname === 'table' && 
               attr.summary && attr.summary.indexOf('links to') === 0)  {        
             state++;
           }
           if (state === 1 && 
               tagname === 'a' && 
               attr.class &&
               attr.class === 'stats') {
             state++;
             
           }             
         },
         ontext: function(text) {
           if (state === 2) {
             if (words.indexOf(text) === -1 ) {
               if (text && typeof text === 'string') {
                 text = text.toLowerCase();
                 var val = stmt.get(text);
                 if (val === undefined) {
                   words.push(text);    
                 } else {
                   console.log('blocked word ', val, text)
                 }
               }
             }
           }
         },
         onclosetag: function(tagname) {
           if (tagname === 'table') {
             state = 0;
           }
           if (tagname === 'a' && state > 1) {
             state--;
           }
         }
       },{ decodeEntities: true }
    );
    res.on('data', (d) => {
       parser.write(d);
    });
    res.on('error', (error) => {
      console.log(error);
      reject(error);
    });
    res.on('end', (d) => {
      parser.end();
      resolve(words);
    });
  }
  return new Promise(executor);   
}

/* last message tracker */
function Wag(bot, logger) {
  var listener,
      url='https://wordassociation.org/words',
      log = logger || console;
 
  function fetchWag(word, cb) {
    var redirectCount = 0;
    
    function fetchReal(url) {
      http.get(url , (res) => {
        if (res.statusCode < 300) {
          res.setEncoding('utf8');
          new WordParser(res).then((words)=>{ cb(words);  }).catch(()=>{logger.error('wag parse err')});
        } else if (res.statusCode >300 && res.statusCode < 304 ) {
          if (redirectCount > 10 )
          {
            log.error(`wag too many 300: ${res.statusCode}`);  
            cb([]);
          } else {
            if (res.headers && res.headers.location) {
               fetchReal(res.headers.location); // recursive
            }
          }
          redirectCount++;
        } else if (res.statusCode >399) {
          log.error(`wag status: ${res.statusCode}`);  
        } else {
          log.error(`wag Huh? status: ${res.statusCode}`);  
        }
      }).on('error', (e) => {
        log.error(`Got error: ${e.message}`);
      });  
    }
    
    fetchReal(url + '/' + word);
  }
  
  function sendWord(word, message_id) {
    if (!allowed) return;
    function getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    }
    
    fetchWag(word, function(data) {
      
       if (data && data.length > 0) {
         var ok = [];
         for(var i=0; i<data.length; i++) {
           var idx = lastwords.indexOf(data[i]);
           if (idx === -1) {  // && blacklist.indexOf(data[i].toLowerCase()) === -1) {
             ok.push(data[i]);
           }
         }
         if (ok.length > 0) {
           var nxtwrd = ok[getRandomInt(ok.length)];
           bot.send(':' + message_id + ' ' + nxtwrd);
           lastwords.push(nxtwrd);
           if (lastwords.length > 100) {
             lastwords.shift();
           }
         } else {
           bot.send(':' + message_id + ' out of words ...');
         }
       } else {
         log.info('no data for ${word}');
       }
    });
    
  }
  
  var allowed = true;
  var lastwords = [];
  
  function stateHandler(ce) {
    var cnt = ce.content.trim();
    const regex = /^@\S+\s(\w+)(\s<a href="http.+">\(\?\)<\/a>){0,1}$/g;
    var m = regex.exec(cnt);
    if (m && m.length > 1) {
        if (ce.event_type === 1) {
          lastwords.push(m[1]);
        } else {
          if (ce.user_id !== 269324) {
            sendWord(m[1], ce.message_id);
          }
        }
    } else {
      log.info('not regexed',ce.content);
    }
  }
  
  function setAllowed() {
    allowed = false;
    setTimeout(() => { allowed = true; }, 10000);
  }

  return {
    events: [1, 8, 18],
    next: stateHandler
  };
}

module.exports = Wag