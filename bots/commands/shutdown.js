const util = require('../util.js')

/* shutdown for Shadow Wizard */
function Shutdown(bot) {
    var going = false;
    return {
    command: '!!SHU',
  events: [1],
        next: function (ce) {
            if (ce.user_name.toLowerCase().indexOf('shadow wizard') !== -1 &&
                    !going) {
                bot.send('No, @' + ce.user_name + ' that only works on NOVELL NETWARE');
                going = true;
                setTimeout(function () { going = false; }, util.minutes(1));
            }
        }
    };
}

module.exports = Shutdown;