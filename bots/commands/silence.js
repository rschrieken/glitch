function Silence(bot) {
    return {
    command : '!!silence',
    events: [1],
        next: function () {
            bot.silence(true);
        }
    };
}

module.exports = Silence;