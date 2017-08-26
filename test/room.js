var assert = require('assert');
var describe = require('mocha').describe;
var it = require('mocha').it;
var beforeEach = require('mocha').beforeEach;


describe('Chatroom', () => {
  var browser = {
    Browser: function(data) {
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
        postform: function(url, formdata) {
          console.log(url);
          return new Promise((res,rej)=> {
            var ms = new require('stream').Readable();
            ms._read = function(size) { /* do nothing */ };
            setTimeout(()=> {
              ms.emit('data', data);
              ms.emit('end');
            },1);
            res(ms);});
        },
        setpostdata: (replData) => {data = replData  }
      }
    }};
  var mockBrowser = new browser.Browser('{"users":[{"id":42,"displayName":"fubar"}]}');
  var room = require('../server/se-chatroom.js')(1337,'http://chat.example.com/any/url',mockBrowser,'',42);
  var ws = require('../server/simplewebsocket.js');
  
  it('returns its room Id ', function() {
    assert.equal(room.getRoomId(),1337)
  });
    
  it('returns the hostname', function() {
    assert.equal(room.getHostname(),'http://chat.example.com/any/url')
  });
    
  it('postinfo records user', function(done) {
    mockBrowser.setpostdata('{"users":[{"id":42,"displayName":"fubar"}]}');
    var actual = room.postInfo([42]);
    actual.then( () => {
      assert.ok(room.seenUsers[42]);
      done();
    }).catch((e) => { console.log(e); });
  });
  
  it('postinfo forced update of user', function(done) {
    mockBrowser.setpostdata('{"users":[{"id":42,"displayName":"barfu"}]}');
    room.seenUsers[42] = {id:42, displayName:"fubar"};
    var actual = room.postInfo([], [42]);
    actual.then( () => {
      assert.ok(room.seenUsers[42].displayName === 'barfu');
      done();
    }).catch((e) => { console.log(e); done('failed') });
  });
  
  it('postinfo existing user not changed', function(done) {
    mockBrowser.setpostdata('{"users":[{"id":42,"displayName":"barfu"}]}');
    room.seenUsers[42] = {id:42, displayName:"fubar"};
    var actual = room.postInfo([42], []);
    actual.then( () => {
      assert.equal(room.seenUsers[42].displayName,'barfu');
      done();
    }).catch((e) => { console.log(e); done('failed') });
  });
  
  it('postinfo new user added with count', function(done) {
    mockBrowser.setpostdata('{"users":[{"id":1337,"displayName":"foo"}]}');
    
    var actual = room.postInfo([1337]);
    actual.then( () => {
      assert.equal(room.seenUsers[1337].displayName,'foo');
      assert.equal(room.seenUsers[1337].cnt,0);
      
      done();
    }).catch((e) => { console.log(e); done('failed') });
  });
  
  
  it('Avatar or name change is reflected in seenUsers', function(done) {
    mockBrowser.setpostdata('{"users":[{"id":1337,"displayName":"fubar"}]}');
    var hnd = new ws.SocketHandler(room);
    
    hnd.message({data:'{"r1337":{"e":[{"event_type":34, "target_user_id":1337}]}}'})
    setTimeout(()=>{
      assert.equal(room.seenUsers[1337].displayName,'fubar');
      done();
    },100);
    
  });
  
  
});
