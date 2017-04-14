var Bot = Bot || {};
window.addEventListener('load', function() {
  var button = document.getElementById('start');
  button.addEventListener('click', function() {
    Bot.start();
  });
});