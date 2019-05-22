var assert = require('assert');
var describe = require('mocha').describe;
var it = require('mocha').it;
var beforeEach = require('mocha').beforeEach;

describe('Bot commands', function() {
  describe('blame on a list with no seen users ', function() {
    it('sends nothing to bot', function(done) {
      var bot = {
        seenUsers: function() { return {42: {name: 'foo'}} },
        send: function(m) { 
          done('should not send a message') },
        getHostname: () => {return'https://test'}
      }
      var command = new require('../bots/commands/blame.js')(bot);
      command.next({});
      done();
    });
  });
  
  describe('blame a user', function() {
    it('sends blame to user', function(done) {
      var bot = {
        seenUsers: function() { return {42: {name: 'foo', cnt:1, is_moderator:false}}},
        send: function(m) { 
          assert.ok(m.indexOf('@foo') > 0); 
          done() },
        getHostname: () => {return'https://test'}
      }
      var command = new require('../bots/commands/blame.js')(bot);
      command.next({message_id:42});
      
    });
  });
  
  describe('blame a user', function() {
    it('sends blame to user with a reason', function(done) {
      var bot = {
        seenUsers: function() { return {42: {name: 'foo', cnt:1, is_moderator:false}} },
        send: function(m) { 
          assert.ok(m.indexOf('@foo') > 0); 
          assert.ok(m.indexOf('for fubar') > 0); 
          done() },
        getHostname: () => {return'https://test'}
      }
      var command = new require('../bots/commands/blame.js')(bot);
      command.next({message_id:42}, 'fubar');
      
    });
  });
  
  describe('blame a user', function() {
    it('sends blame to user with a ping', function(done) {
      var bot = {
        seenUsers: function() { return {42: {name: 'foo', cnt:1, is_moderator:false}} },
        send: function(m) { 
          assert.ok(m.indexOf('@foo') > 0); 
          assert.ok(m.indexOf('for @fubar') > 0); 
          done() },
        getHostname: () => {return'https://test'}
      }
      var command = new require('../bots/commands/blame.js')(bot);
      command.next({message_id:42}, '@fubar');
      
    });
  });
  
  describe('blame a user', function() {
    it('sends blame to user with space in name with a ping', function(done) {
      var bot = {
        seenUsers: function() { return {42: {name: 'fu bar', cnt:1, is_moderator:false}} },
        send: function(m) { 
          assert.ok(m.indexOf('@fubar') > 0); 
          done() },
        getHostname: () => {return'https://test'}
      }
      var command = new require('../bots/commands/blame.js')(bot);
      command.next({message_id:42, name:'fu bar'});
      
    });
  });
});