var mrt = require('./helpers');
var path = require('path');
var fs = require('fs');
var assert = require('assert');

// TODO -- these tests should probably use alternate versions of meteor which output
// different things rather than relying on 'fetching meteor' type messages
//
// TODO -- test the smart.json created
// TODO -- test with path

describe('invoking `mrt create`', function() {
  beforeEach(function(done) {
    mrt.prepare(done);
  });
  
  afterEach(function(done) {
    mrt.cleanup(done);
  });
  
  describe('with no arguments', function() {
    it("should create an app from the default branch of meteor", function(done) {
      mrt.invoke('create app-from-default-meteor', 'new_apps', {
        waitForOutput: ['Installing Meteor [branch: https://github.com/meteor/meteor.git#master]', 'app-from-default-meteor: created']      
      }, done);
    });

    it("should add a smart.json to newly created app", function(done) {
      mrt.invoke('create new-app-with-smart-json', 'new_apps', {
        waitForOutput: ['Installing Meteor [branch: https://github.com/meteor/meteor.git#master]', 'new-app-with-smart-json: created']
      }, function() {
        var appDir = path.resolve('spec/support/apps/new_apps/new-app-with-smart-json');
        var smartJsonPath = path.join(appDir, 'smart.json');
        assert.ok(fs.existsSync(smartJsonPath));
        done();
      });
    });
  });
  
  describe('with a --branch argument', function() {
    it("should create an app from a non-default branch", function(done) {
      mrt.invoke('create --branch devel app-from-non-default-meteor', 'new_apps', {
        waitForOutput: ['Installing Meteor [branch: https://github.com/meteor/meteor.git#devel]']      
      }, done);
    });
  });
  
  describe('with an --example argument', function() {
    it("should create an example app", function(done) {
      mrt.invoke('create --example todos', 'new_apps', {
        waitForOutput: ['Installing Meteor [branch: https://github.com/meteor/meteor.git#master]', 'todos: created']      
      }, done);
    });
  });
});