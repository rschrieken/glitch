var Bot = function(bot) {
  var scope = bot || {};
  
  function start() {
    console.log('start');
  }
  
  scope.start = start;
  
  return scope;
}(Bot)