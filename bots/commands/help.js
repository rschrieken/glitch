const util = require('../util.js');

function Help(bot) {
	    var msg = '', infosilent = false, trackedId;
		return {
			command : '!!help',
			events: [1],
			next: function (e, a) {
        var states = bot.states();
				if (!infosilent) {
          trackedId = e.message_id;
				  if (a !== undefined) {
						msg = a + '\r\n';
					}
					for(var s =0; s< states.length; s++){
            var state = states[s];
					    if (state.command) {
							msg = msg + state.command  + '\r\n';
						}
					}
					bot.send(msg);
					setTimeout(function () { infosilent = false; }, util.minutes(60));
					infosilent = true;
				} else {
          if (trackedId) {
            bot.send(':' + trackedId + ' did run that command earlier ...');
            trackedId = undefined;
          } else {
            console.log('hammered by %s', e.userid);
          }
        }
			}
		};
	}

module.exports = Help;