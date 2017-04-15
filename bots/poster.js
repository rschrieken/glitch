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
      preptxt = (txt.indexOf(':') !== 0 ? prep : '') + txt;
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
        room.postMessage(txt).then(() => {if (throttle > util.seconds(2)) {
              throttle = throttle - Math.round(throttle / 4);
              if (throttle < util.seconds(2)) {
                  throttle = util.seconds(2);
              }
          }
        });
      } catch(e) {
        console.log(e);
      }
    }
  }

  function ownMessageReceived() {
    if (ownmsg.length > 100) {
      ownmsg.shift();
    }
    ownmsg.push(Date.now());
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
  
  function init() {
    interval = setInterval(function () {
        var txt;
        if (isCurrentRateFine(ownmsg)) {
            txt = msg.shift();
            if (txt !== undefined) {
                realsend(txt);
            }
        } else {
            console.log('throtled:' + ownmsg[ownmsg.length - 1].toString());
        }
    }, util.seconds(2));
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