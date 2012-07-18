var vows = require('vows');
var assert = require('assert');
var xmlb = require('index');


vows.describe('xmlb').addBatch({
  
  'module': {
    'should export module function': function () {
      assert.isFunction(xmlb);
    },
    'should export compile and render function': function () {
      assert.isFunction(xmlb.compile);
      assert.isFunction(xmlb.render);
    },
    'should support express': function () {
      assert.isFunction(xmlb.__express);
      assert.strictEqual(xmlb.__express, xmlb);
    },
  },
  
  'render file': {
    topic: function(redirect) {
      var self = this;
      var options = { name: 'world' };
      xmlb(__dirname + '/fixtures/hello.xmlb', options, function(err, res) {
        self.callback(err, res);
      });
    },
    
    'should not error' : function(err, res) {
      assert.isNull(err);
    },
    'should render correctly' : function(err, res) {
      assert.equal(res, '<root><hello name="world"/></root>');
    },
  },
  
  'render file prettily': {
    topic: function(redirect) {
      var self = this;
      var options = { name: 'world', pretty: true };
      xmlb(__dirname + '/fixtures/hello.xmlb', options, function(err, res) {
        self.callback(err, res);
      });
    },
    
    'should not error' : function(err, res) {
      assert.isNull(err);
    },
    'should render correctly' : function(err, res) {
      assert.equal(res, '<root>\n  <hello name="world"/>\n</root>\n');
    },
  },
  
  'render file with document option': {
    topic: function(redirect) {
      var self = this;
      var options = { document: 'doc' };
      xmlb(__dirname + '/fixtures/doc.xmlb', options, function(err, res) {
        self.callback(err, res);
      });
    },
    
    'should not error' : function(err, res) {
      assert.isNull(err);
    },
    'should render correctly' : function(err, res) {
      assert.equal(res, '<foo><bar/></foo>');
    },
  },
  
  'render file with self option': {
    topic: function(redirect) {
      var self = this;
      var options = { name: 'world', self: true };
      xmlb(__dirname + '/fixtures/hello-self.xmlb', options, function(err, res) {
        self.callback(err, res);
      });
    },
    
    'should not error' : function(err, res) {
      assert.isNull(err);
    },
    'should render correctly' : function(err, res) {
      assert.equal(res, '<root><hello name="world"/></root>');
    },
  },
  
  'render file without locals': {
    topic: function(redirect) {
      var self = this;
      xmlb(__dirname + '/fixtures/static.xmlb', function(err, res) {
        self.callback(err, res);
      });
    },
    
    'should not error' : function(err, res) {
      assert.isNull(err);
    },
    'should render correctly' : function(err, res) {
      assert.equal(res, '<beep><boop/></beep>');
    },
  },
  
  'useful stack traces': {
    topic: function(redirect) {
      var self = this;
      
      var str = [
        "xml.begin('root')",
        "  .ele('hello', {'name': name })" // Failing line 
      ].join("\n");
      
      xmlb.render(str, function(err, res) {
        self.callback(err, res);
      });
    },
    
    'should error' : function(err, res) {
      assert.strictEqual(err.name, 'ReferenceError');
      assert.include(err.message, 'name is not defined');
      assert.include(err.message, 'xmlb:');
    },
  },
  
  'non useful stack traces': {
    topic: function(redirect) {
      var self = this;
      var options = { compileDebug: false };
      
      var str = [
        "xml.begin('root')",
        "  .ele('hello', {'name': name })" // Failing line 
      ].join("\n");
      
      xmlb.render(str, options, function(err, res) {
        self.callback(err, res);
      });
    },
    
    'should error' : function(err, res) {
      assert.strictEqual(err.name, 'ReferenceError');
      assert.include(err.message, 'name is not defined');
      assert.equal(err.message.indexOf('xmlb:'), -1);
    },
  },
  
}).export(module);
