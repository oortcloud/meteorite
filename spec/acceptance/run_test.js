var assert = require('assert');
var path = require('path');
var mrt = require('./helpers');
var Meteorite = require('../../lib/meteorite');

describe('`mrt run`', function() {
  
  before(function(done) {
    TestServer.start(done);
  });
  
  beforeEach(function(done) {
    mrt.uninstall(done);
  });

  describe('invoked in a non-meteor project directory', function(done) {
    it("should display a message about not being in a meteor project dir", function(done) {
      mrt.invoke('run', 'empty-dir', {
        waitForOutput: "You're not in a Meteor project directory"
      }, done);
    })
  });

  describe('invoked in a meteor project without a smart.json', function(done) {
    it("should run the app without installing anything", function(done) {
      mrt.invoke('run', 'app-without-smart-json', {
        waitForOutput: "Running on: http://localhost:"
      }, done);
    })
  });

  describe('invoked in a meteor project with a smart.json', function(done) {
    describe('and the smart.json specifies a smart package dependency', function(done) {
      it("should install all dependencies", function(done) {
        mrt.invoke('run', 'app-with-smart-json', {
          waitForOutput: "meteorite test package installed!"
        }, done);
      })
    });
  });

});
