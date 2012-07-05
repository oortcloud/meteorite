var mrt = require('./helpers');

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
      it("should install the smart package", function(done) {
        mrt.invoke('run', 'app-with-smart-pkg', {
          waitForOutput: "Test package 1 installed (branch/master)"
        }, done);
      })
    });
    
    describe("and the smart.json specifies a smart package pinned to a branch", function(done) {
      it("should install the smart package pinned to a specified branch", function(done) {
        mrt.invoke('run', 'app-with-smart-pkg-pinned-to-branch', {
          waitForOutput: "Test package 1 installed (branch/test-branch)"
        }, done);
      })
    });
    
    describe("and the smart.json specifies a smart package repo pinned to a tag", function(done) {
      it("should install the smart package pinned to a specified tag", function(done) {
        mrt.invoke('run', 'app-with-smart-pkg-pinned-to-tag', {
          waitForOutput: "Test package 1 installed (tag/test-tag-1)"
        }, done);
      })
    });
    
    describe("and the smart.json specifies a smart package repo pinned to a git sha ref", function(done) {
      it("should install the smart package pinned to a specified ref", function(done) {
        mrt.invoke('run', 'app-with-smart-pkg-pinned-to-ref', {
          waitForOutput: "Test package 1 installed (ref)"
        }, done);
      })
    });

    describe("and the smart.json specifies a smart package repo with it's own smart package dependency", function(done) {
      it("should discover and install smart packages recursively", function(done) {
        mrt.invoke('run', 'app-with-nested-smart-pkg-deps', {
          waitForOutput: [
            "Test package 1 installed (branch/master)",
            "Test package 2 installed (branch/master)"
          ]
        }, done);
      })
    });

  });

});
