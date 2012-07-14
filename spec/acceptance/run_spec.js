var mrt = require('./helpers');

describe('invoking `mrt run`', function() {
  
  beforeEach(function(done) {
    mrt.prepare(done);
  });

  describe('in a non-meteor project directory', function() {
    it("should display a message about not being in a meteor project dir", function(done) {
      mrt.invoke('run', 'empty-dir', {
        waitForOutput: "You're not in a Meteor project directory"
      }, done);
    });
  });
  
  describe('in a meteor project without a smart.json', function() {
    it("should run the app without installing anything", function(done) {
      mrt.invoke('run', 'app-without-smart-json', {
        waitForOutput: "Running on: http://localhost:"
      }, done);
    });
  });

  describe('in a meteor project with a smart.json', function() {

    describe('and the smart.json specifies a smart package dependency', function() {
      it("should install the smart package", function(done) {
        mrt.invoke('run', 'app-with-smart-pkg', {
          waitForOutput: "Test package 1 installed (branch/master)"
        }, done);
      });
    });
    
    describe("and the smart.json specifies a smart package pinned to a branch", function() {
      it("should install the smart package pinned to a specified branch", function(done) {
        mrt.invoke('run', 'app-with-smart-pkg-pinned-to-branch', {
          waitForOutput: "Test package 1 installed (branch/test-branch)"
        }, done);
      });
    });
    
    describe("and the smart.json specifies a smart package repo pinned to a tag", function() {
      it("should install the smart package pinned to a specified tag", function(done) {
        mrt.invoke('run', 'app-with-smart-pkg-pinned-to-tag', {
          waitForOutput: "Test package 1 installed (tag/test-tag-1)"
        }, done);
      });
    });
    
    describe("and the smart.json specifies a smart package repo pinned to a git sha ref", function() {
      it("should install the smart package pinned to a specified ref", function(done) {
        mrt.invoke('run', 'app-with-smart-pkg-pinned-to-ref', {
          waitForOutput: "Test package 1 installed (ref)"
        }, done);
      });
    });
    
    describe("and the smart.json specifies a smart package from a path", function() {
      it("should install the smart package linked to the path", function(done) {
        mrt.invoke('run', 'app-with-smart-pkg-specified-by-path', {
          waitForOutput: "Test package 1 installed (from a fixed path)"
        }, done);
      });
    });
    
    describe("and the smart.json specifies a smart package repo with it's own smart package dependency", function() {
      it("should discover and install smart packages recursively", function(done) {
        mrt.invoke('run', 'app-with-nested-smart-pkg-deps', {
          waitForOutput: [
            "Test package 1 installed (branch/master)",
            "Test package 2 installed (branch/master)"
          ]
        }, done);
      });
    });

  });

});
