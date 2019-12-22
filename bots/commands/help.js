const util = require('../util.js');

// from ShadowWizard
// https://jsfiddle.net/3w7uh4xt/
// http://chat.meta.stackexchange.com/transcript/message/5924083#5924083
function FormatSeconds(seconds) {
    if (seconds <= 0)
        return 'a moment';
    if (seconds < 60)
        return 'less than a minute';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 2)
        return 'a minute';
    if (minutes < 60)
        return minutes + ' minutes';
    var hours = Math.floor(minutes / 60);
    if (hours < 2)
        return 'an hour';
    if (hours < 24)
        return hours + ' hours';
    var days = Math.floor(hours / 24);
    if (days < 366)
        return days + ' days';
    return 'more than an year';
}

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
							msg = msg + 
                state.command  + 
                (state.usage?' ' + state.usage:'')+
                (typeof state.ttw === "function" && state.ttw() !== undefined ? 
                 ' ( wait ' + FormatSeconds((state.ttw().getTime() - new Date().getTime())/1000) + ' )' :'' ) + 
                '\r\n';
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