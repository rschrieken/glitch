var assert = require('assert');
var describe = require('mocha').describe;
var it = require('mocha').it;
var beforeEach = require('mocha').beforeEach;

describe('Bot commands', function() {
  describe('flush ', function() {
    it('sends flush bot', function(done) {
      this.timeout(5000);
      var cnt = 0;
      var bot = {
        send: function(m) { 
          console.log(m);
          cnt++;
          if (cnt > 1) done(); else command.next({ message_id: 4242 });
        },
        getHostname: () => { return'https://test'}
      }
      var command = new require('../bots/commands/flush.js')(bot);
      assert.equal('!!flush',command.command);
      command.next({ message_id: 42 });
      
      
      //done();
    });
  });
  
});