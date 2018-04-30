var assert = require('assert');
var describe = require('mocha').describe;
var it = require('mocha').it;
var beforeEach = require('mocha').beforeEach;

describe('Wag', () => {
  var Wag = require('../bots/commands/wag.js');
  
  describe('A Wag command', () => {
    
    it('accepts data', (done) => {
      var bot = {
        send: (t) => { console.log(t); done();},
        error: (e) => {done(false)},
        info: (e) => {console.log(e);done();}
      };
      
      var wag = new Wag(bot, bot);
      wag.next({content:'@usr hello', event_type:18});
      
    });
    
    it('accepts Fox 9000 data', (done) => {
      var bot = {
        send: (t) => { console.log('send', t); done();},
        error: (e) => {console.error('err', e);done(false)},
        info: (e) => {console.log('info',e); done(false);}
      };
      
      var wag = new Wag(bot, bot);
      wag.next({content:'@usr hello <a href="https://example.org">(?)</a>', event_type:18});
      
    });
  });
});