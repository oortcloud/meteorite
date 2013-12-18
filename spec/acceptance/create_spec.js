var runner = require('../lib/runner.js');
var utils = require('../lib/utils.js');

var path = require('path');
var fs = require('fs');
var assert = require('assert');

// TODO -- these tests should probably use alternate versions of meteor which output
// different things rather than relying on 'fetching meteor' type messages
//
// TODO -- test the smart.json created
// TODO -- test with path


describe('invoking `mrt create`', function() {
  describe('with no arguments', function() {
    it("should create an app from the default branch of meteor", function(done) {
      runner.invokeMrt(utils.appHome, ['create', 'app-from-default-meteor'], {
        waitForOutput: [
          'app-from-default-meteor: created'
        ]      
      }, done);
    });

    it("should add a smart.json to newly created app", function(done) {
      var appName = 'new-app-with-smart-json';
      runner.invokeMrt(utils.appHome, ['create', appName], {
        waitForOutput: [
          'new-app-with-smart-json: created'
        ]
      }, function() {
        var smartJsonPath = path.join(utils.appHome, appName, 'smart.json');
        assert.ok(fs.existsSync(smartJsonPath));
        done();
      });
    });
  });
  
  // describe('with a --branch argument', function() {
  //   it("should create an app from a non-default branch", function(done) {
  //     runner.invokeMrt(utils.appHome, ['create', '--branch=devel', 'app-from-non-default-meteor'], {
  //       waitForOutput: [
  //         'Installing Meteor',
  //         'branch: https://github.com/meteor/meteor.git#devel'
  //       ]      
  //     }, done);
  //   });
  // });
  
  describe('with an --example argument', function() {
    it("should create an example app", function(done) {
      runner.invokeMrt(utils.appHome, ['create', '--example=todos'], {
        waitForOutput: [
          'todos: created'
        ]      
      }, done);
    });
  });
});