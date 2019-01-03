const util = require('./util.js');

function MessagePoster(room, prepend) {
  var msg = [],
      throttle = util.seconds(2),
      ownmsg = [Date.now()],
      silent = false,
      interval,
      prep = prepend || '~ ';
  
  /* put a chatmessage on the queue, either direct or after certain time*/
  /* txt = text to send
     sorm = seconds if s is not given
          = munutes if s is given
    s   = seconds
  */
  function send(txt, sorm, s) {
    var time,
      preptxt = ((txt.indexOf(':') !== 0 && txt.indexOf('    ') !== 0 ) ? prep : '') + txt;
    if (s === undefined && sorm === undefined) {
      msg.push(preptxt);
    } else {
      if (s === undefined) {
        time = util.seconds(sorm);
      } else {
        time = util.minutes(sorm) + util.seconds(s);
      }
      setTimeout(function () { msg.push(preptxt); }, util.getRandomArbitrary(time, time + (time / 2)));
    }
  }

  function realsend(txt) {
    if (silent) {
        console.log(txt);
    } else {
      try {
        
        room.postMessage(txt).then(() => {
          if (throttle > util.seconds(2)) {
              throttle = throttle - Math.round(throttle / 4);
              if (throttle < util.seconds(2)) {
                  throttle = util.seconds(2);
              }
              init();
          }
        }).catch((e)=>{ console.warn('realsend error', e); ownMessageReceived(); init();});
      } catch(e) {
        console.log(e);
      }
    }
  }

  function ownMessageReceived() {
    var now = Date.now();
    if (ownmsg.length > 100) {
      ownmsg.shift();
    }
    if (ownmsg.length === 0 || ( ownmsg.length > 0 && ownmsg[0] !== now)) {
       ownmsg.push(now);
    }
    return ownmsg.length;
  }
  
  function isCurrentRateFine(seconds) {
      var limit = 0.0,
          a = seconds.length,
          b = 0,
          throttled = false,
          baseSecs = Date.now(),
          i;

      function rateLimit(x) {
          return Math.min((4.1484 * Math.log(x < 2 ? 2 : x) + 1.02242), 20);
      }

      for (i = seconds.length - 1; i > 0; i = i - 1) {
          limit = rateLimit(a - i);

          if (baseSecs - seconds[i] < limit && !throttled) {
              throttled = true;
              b = limit - (baseSecs - seconds[i]);
              baseSecs = seconds[i];
          } else {
              if (b - (baseSecs - seconds[i]) < 0) {
                  a = i;
                  throttled = false;
                  baseSecs = seconds[i];
              }
              if (baseSecs - seconds[i] > limit && !throttled) {
                  throttled = false;
              }

              if (baseSecs - seconds[i] > limit * 2) {
                  a = i;
                  throttled = false;
                  baseSecs = seconds[i];
              }
          }
      }

      limit = rateLimit(a);

      return !(baseSecs - seconds[0] < limit);
  }
  
  function stop() {
      clearInterval(interval);
  }
  
  var throttleFallback; 
  
  function startThrottleFallback() {
    if (throttleFallback) {
      console.log('already waiting for throttle');
    } else {
      throttleFallback = setTimeout(ownMessageReceived, 2 * 60 * 1000); // 2 minutes
    }
  }
  
  function stopThrottleFallback() {
    if (throttleFallback) {
      console.log('clearing throttle fallback');
      clearTimeout(throttleFallback);
    }
  }
  
  function init() {
    if (interval) stop();
    
    interval = setInterval(function () {
        var txt;
        if (isCurrentRateFine(ownmsg)) {
            txt = msg.shift();
            if (txt !== undefined) {
                stopThrottleFallback();
                realsend(txt);
            }
        } else {
            console.log('throtled:' + ownmsg[ownmsg.length - 1].toString());
            startThrottleFallback();
        }
    }, throttle);
  }
  
  init();
  
  return {
    send: send,
    ownMessageReceived: ownMessageReceived,
    stop: stop,
    silent: function (val) { if (val !== undefined) {silent = val;} return silent;}
  }
}

exports.MessagePoster = MessagePoster;