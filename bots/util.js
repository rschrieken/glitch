function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function seconds(s) {
    return s * 1000;
}

function minutes(m) {
    return seconds(60) * m;
}

module.exports.getRandomArbitrary = getRandomArbitrary;
module.exports.seconds = seconds;
module.exports.minutes = minutes;