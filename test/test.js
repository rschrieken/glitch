var assert = require('assert');


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
        fkey===expect ? done() : done('fkey ' + fkey + ' <> ' + expect);
      });
      resp.emit('data', '<input name="fkey" value="42" />');        
      resp.emit('end', '');        
      
    });
  });
  
});