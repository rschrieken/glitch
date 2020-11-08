function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomMax(maxInt) {
  return Math.floor(Math.random() * Math.floor(maxInt));
}

function seconds(s) {
    return s * 1000;
}

function minutes(m) {
    return seconds(60) * m;
}

module.exports.getRandomArbitrary = getRandomArbitrary;
module.exports.getRandomMax = getRandomMax;
module.exports.seconds = seconds;
module.exports.minutes = minutes;