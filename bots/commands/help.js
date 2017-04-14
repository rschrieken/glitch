const util = require('../util.js');

function Help(bot) {
	    var msg = '', infosilent = false;
		return {
			command : '!!help',
			events: [1],
			next: function (e, a) {
        var states = bot.states();
				if (!infosilent) {
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
				}
			}
		};
	}

module.exports = Help;