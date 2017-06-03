var assert = require('assert');
var describe = require('mocha').describe;
var it = require('mocha').it;
var beforeEach = require('mocha').beforeEach;

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});

describe('simpleparser', () => {
  var parser = require('../server/simpleparsers.js');
  const EventEmitter = require('events');
  
  
  describe('A successful debug parser', () => {
    it('accepts data and end event', (done) => {
      var resp = new EventEmitter();
      var db = new parser('debug', resp).then(()=>{
        done();
      });
      resp.emit('data', 'test');        
      resp.emit('end', 'test');        
      
    });
  });
  
  describe('An error debug parser', () => {
    it('accepts an error event', (done) => {
      var resp = new EventEmitter();
      var db = new parser('debug', resp).then(()=>{
        done('failed');
      }, () => { 
        done(); });
      resp.emit('error', 'test');        
    });
  });
  
  describe('A successful fkey parser', () => {
    it('returns an fkey from an html stream', (done) => {
      var expect = '42';
      var resp = new EventEmitter();
      new parser('fkey', resp).then((fkey)=>{
        //assert.equal('41', fkey);
        fkey.fkey===expect ? done() : done('fkey ' + fkey.fkey + ' <> ' + expect);
      });
      resp.emit('data', '<input name="fkey" value="42" />');        
      resp.emit('end', '');        
      
    });
  });
  
});

describe('Poster', () => {
  var poster = require('../bots/poster.js');
  var room;
  var cb;
  const EventEmitter = require('events');
  
  beforeEach(() => {
    cb = null;
    room = {
      postMessage: function(msg){
        if (cb!==null) cb();
        return new Promise((r,e)=> {r(msg)})
      }
    };
  })
  
  describe('Create a poster', () => {
    it('accepts a room', () => {
      var msgposter = new poster.MessagePoster(room);
      assert.ok(msgposter);
    });
  });
  
  describe('Create a poster with a prepend', () => {
    it('accepts a room and a prepend', () => {
      var msgposter = new poster.MessagePoster(room, 'x');
      assert.ok(msgposter);
    });
  });
  
  describe('Set a poster to silent', () => {
    it('accepts a value of true', () => {
      var msgposter = new poster.MessagePoster(room);
      var val = msgposter.silent(true);
      assert.ok(val);
    });
  });
  
  describe('Get a posters value of silent', () => {
    it('should return false', () => {
      var msgposter = new poster.MessagePoster(room);
      var val = msgposter.silent();
      assert.equal(false, val);
    });
  });
  
  describe('Toggle a posters value of silent', () => {
    it('should toggle', () => {
      var msgposter = new poster.MessagePoster(room);
      var toggle = msgposter.silent();
      var val = msgposter.silent(!toggle);
      assert.equal(!toggle, val);
    });
  });
  
  describe('ownMessage', () => {
    it('should return a length', (done) => {
      var msgposter = new poster.MessagePoster(room);
      var len = msgposter.ownMessageReceived();
      assert.equal(1 , len);
      setTimeout(() => {
        len = msgposter.ownMessageReceived();
        assert.equal(2 , len);
        done();
      }, 100);
      
    });
  });
  
  describe('stop', () => {
    it('should not throw', () => {
      var msgposter = new poster.MessagePoster(room);
      assert.doesNotThrow(msgposter.stop);
      assert.doesNotThrow(msgposter.stop);
    });
  });
  
  describe('send further', () => {
    it('should post', function (done) {
      this.timeout(5000);
      var msgposter = new poster.MessagePoster(room);
      cb = done;
      assert.doesNotThrow(() => {msgposter.send('fubar')});
    });
  });
  
  describe('send', () => {
    it('should post after a second', function (done) {
      this.timeout(3000);
      var msgposter = new poster.MessagePoster(room);
      cb = done;
      assert.doesNotThrow(() => {msgposter.send('fubar', 1)});
    });
  });
  
   describe('send', () => {
    it('should post after a minute second', function (done) {
      this.timeout(3000);
      var msgposter = new poster.MessagePoster(room);
      cb = done;
      assert.doesNotThrow(() => {msgposter.send('fubar', 0.001, 1)});
    });
  });
  
  
  describe('send', () => {
    it('should not post when silent', function (done) {
      this.timeout(5000);
      var msgposter = new poster.MessagePoster(room);
      cb = function() {done('called anway')};
      msgposter.silent(true);
      assert.doesNotThrow(() => {msgposter.send('fubar')});
      setTimeout(done,3000);
    });
  });
  
  describe('throttle clears', () => {
    it('should post once throttle is over', function (done) {
      var timer;
      this.timeout(10000);
      var msgposter = new poster.MessagePoster(room);
      cb = function() {done(); clearTimeout(timer);};
      msgposter.ownMessageReceived();
      msgposter.ownMessageReceived();
      msgposter.ownMessageReceived();
      assert.doesNotThrow(() => {msgposter.send('fubar')});
      timer = setTimeout( () => {done('throttled!')},9000);
    });
  });
  
  describe('throttle clears for different timings', () => {
    it('should post once throttle is over', function (done) {
      var timer;
      this.timeout(10000);
      var msgposter = new poster.MessagePoster(room);
      cb = function() {done(); clearTimeout(timer);};
      msgposter.ownMessageReceived();
      msgposter.ownMessageReceived();
      setTimeout(() => {msgposter.ownMessageReceived();}, 100);
      setTimeout(() => {msgposter.ownMessageReceived();}, 200);
      setTimeout(() => {msgposter.ownMessageReceived();}, 300);
      assert.doesNotThrow(() => {msgposter.send('fubar')});
      
      timer = setTimeout( () => {done('throttled!')},9000);
    });
  });
  
});

describe('Stack Exchange login', () => {
  var browser = {
    Browser: function() {
      return {
        get: function(url) {
          function exec(res,rej) {
            var ms = new require('stream').Readable();
            ms._read = function(size) { /* do nothing */ };
            setTimeout(()=> {
              ms.emit('data', '<input name="fkey" value="42" />');
              ms.emit('end');
            },1);
            res(ms);
          }
          
          return new Promise(exec);
        },
        postform: function(url, data) {
          return new Promise((res,rej)=> {
            var ms = new require('stream').Readable();
            ms._read = function(size) { /* do nothing */ };
            setTimeout(()=> {
              ms.emit('data', '<input name="fkey" value="42" />');
              ms.emit('end');
            },1);
            res(ms);});
        }
      }
    }};
  var login = require('../server/se-login.js')( browser);
  it('is not isInitialized ', function() {
    assert.equal(login.isInitialized(),false)
  });
  
  it('no data is not valid', function() {
    var expected = false;
    var actual = login.isLoginValid();
    assert.equal(actual,expected);
  });
  
  it('all data is valid', function() {
    var expected = true;
    var actual = login.isLoginValid({user: 'a', pwd:'b', roomId:'42', server:'1'});
    assert.equal(actual,expected);
  });
  
  it('login u/p', function(done) {
    var expected = true;
    var actual = login.login('a','b','42','1');
    actual.then(done());
  });
  
});

describe('Util', () => {
  var util = require('../bots/util.js');

  
  describe('random time ', () => {
    it('returns a time between lower and upper', () => {
      var time = util.getRandomArbitrary(6,8);
      assert.ok(time>=6 && time <=8);
    });
  });
  
  describe('seconds ', () => {
    it('returns 1000 ms for each second', () => {
      var time = util.seconds(1);
      assert.equal(1000,time);
    });
  });
  
  describe('seconds ', () => {
    it('returns 1000 ms for each second', () => {
      var time = util.seconds(2);
      assert.equal(2000,time);
    });
  });
  
  describe('minutes ', () => {
    it('returns 60000 ms for each minute', () => {
      var time = util.minutes(1);
      assert.equal(60000,time);
    });
  });
  
});