var runner = require('../lib/runner.js');

describe('invoking `mrt run`', function() {

  describe('in a non-meteor project directory', function() {
    it("should display a message about not being in a meteor project dir", function(done) {
      runner.invokeMrt('', ['run'], {
        waitForOutput: "You're not in a Meteor project directory"
      }, done);
    });
  });
  
  describe('in a meteor project without a smart.json', function() {
    it("should run the app without installing anything", function(done) {
      runner.invokeMrtInApp('app-without-smart-json', ['run'], {
        waitForOutput: "Meteor server running on: http://localhost:"
      }, done);
    });
  });

  describe('in a meteor project with a smart.json', function() {
  
    describe('and the smart.json specifies a simple smart package dependency', function() {
      it("should install the smart package", function(done) {
        runner.invokeMrtInApp('app-with-smart-pkg', ['run'], {
          waitForOutput: "Test package 1 installed (branch/master)"
        }, done);
      });
    });
    
    describe("and the smart.json specifies a smart package pinned to a branch", function() {
      it("should install the smart package pinned to a specified branch", function(done) {
        runner.invokeMrtInApp('app-with-smart-pkg-pinned-to-branch', ['run'], {
          waitForOutput: "Test package 1 installed (branch/test-branch)"
        }, done);
      });
    });
    
    describe("and the smart.json specifies a smart package repo pinned to a tag", function() {
      it("should install the smart package pinned to a specified tag", function(done) {
        runner.invokeMrtInApp('app-with-smart-pkg-pinned-to-tag', ['run'], {
          waitForOutput: "Test package 1 installed (tag/test-tag-1)"
        }, done);
      });
    });
    
    describe("and the smart.json specifies a smart package repo pinned to a git sha ref", function() {
      it("should install the smart package pinned to a specified ref", function(done) {
        runner.invokeMrtInApp('app-with-smart-pkg-pinned-to-ref', ['run'], {
          waitForOutput: "Test package 1 installed (ref)"
        }, done);
      });
    });
    
    describe("and the smart.json specifies a smart package from a path", function() {
      it("should install the smart package linked to the path", function(done) {
        runner.invokeMrtInApp('app-with-smart-pkg-specified-by-path', ['run'], {
          waitForOutput: "Test package 1 installed (from a fixed path)"
        }, done);
      });
    });
    
    describe("and the smart.json specifies a smart package repo with it's own smart package dependency", function() {
      it("should discover and install smart packages recursively", function(done) {
        runner.invokeMrtInApp('app-with-nested-smart-pkg-deps', ['run'], {
          waitForOutput: [
            "Test package 1 installed (branch/master)",
            "Test package 2 installed (branch/master)"
          ]
        }, done);
      });
    });
    
    describe("and the smart.json specifies a smart package from a path with it's own smart package dependency from a path", function() {
      it("should discover and install smart packages recursively", function(done) {
        runner.invokeMrtInApp('app-with-nested-smart-pkg-deps-specified-by-paths', ['run'], {
          waitForOutput: [
            "Test package 1 installed (from a fixed path)",
            "Test package 2 installed (from a fixed path)"
          ]
        }, done);
      });
    });
    
    describe("and the smart.json specifies two packages that clash in dependencies", function() {

      it("should not run and output an error message", function(done) {
        runner.invokeMrtInApp('app-with-nested-smart-pkg-deps-that-clash', ['run'], {
          waitForOutput: ["Can't resolve dependencies!"]
        }, done);
      });

      it("should run (with an warning message) if forced", function(done) {
        runner.invokeMrtInApp('app-with-nested-smart-pkg-deps-that-clash', ['run', '--force'], {
          waitForOutput: [
            "Problem installing",
              "mrt-test-pkg1",
              "[branch: https://github.com/possibilities/mrt-test-pkg1.git#master] " +
              "conflicts with " +
              "[branch: https://github.com/tmeasday/mrt-test-pkg1.git#master]; " +
              "keeping [branch: https://github.com/tmeasday/mrt-test-pkg1.git#master]"
          ]
        }, done);
      });
    });
    
    describe('and the smart.json specifies a meteor fork pinned to a branch', function() {
      it("should run the forked meteor checked out to the branch", function(done) {
        runner.invokeMrtInApp('app-with-meteor-pinned-to-branch', ['run'], {
          waitForOutput: "Meteor is instrumented for meteorite test (branch/mrt-branch-test)"
        }, done);
      });
    });

    describe('and the smart.json specifies a meteor fork pinned to a tag', function() {
      it("should run the forked meteor checked out to the branch", function(done) {
        runner.invokeMrtInApp('app-with-meteor-pinned-to-tag', ['run'], {
          waitForOutput: "Meteor is instrumented for meteorite test (tag/mrt-test-tag)"
        }, done);
      });
    });

    describe('and the smart.json specifies a meteor fork pinned to a ref', function() {
      it("should run the forked meteor checked out to the branch", function(done) {
        runner.invokeMrtInApp('app-with-meteor-pinned-to-ref', ['run'], {
          waitForOutput: "Meteor is instrumented for meteorite test (ref)"
        }, done);
      });
    });
  });

});
