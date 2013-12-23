var runner = require('../lib/runner.js');

var shouldInstall = function(baseName) {
  describe('for a meteor package', function() {
    it("should install the smart package", function(done) {
      runner.invokeMrtInApp(baseName, ['add', 'bootstrap'], {
        waitForOutput: "bootstrap: Front-end framework from Twitter"
      }, done);
    });
  });
  
  describe('for an atmosphere package', function() {
    it("should install the smart package", function(done) {
      runner.invokeMrtInApp(baseName, ['add', 'mrt-test-pkg1'], {
        waitForOutput: "mrt-test-pkg1: mrt test package 1"
      }, done);
    });
  });
  
  describe('for a versioned atmosphere package', function() {
    it("should install the versioned smart package", function(done) {
      runner.invokeMrtInApp(baseName, ['add', 'mrt-test-pkg1',  '--pkg-version=0.1.0'], {
        waitForOutput: "mrt-test-pkg1: mrt test package 1 v0.1.0"
      }, done);
    });
  });
};

describe('invoking `mrt add`', function() {
  describe('in a bare meteor app', function() {
    shouldInstall('app-without-smart-json');
  });
  
  describe('in an installed app with a smart.json', function() {
    shouldInstall('app-with-smart-json');
  });
  
  describe('in an uninstalled app with smart.json', function() {
    shouldInstall('uninstalled-app-with-smart-json');
  });
  
  describe('in an uninstalled app with smart.json specifying the package', function() {
    describe('for a meteor package', function() {
      it("should install the smart package", function(done) {
        runner.invokeMrtInApp('uninstalled-app-with-smart-pkg', ['add', 'bootstrap'], {
          waitForOutput: "bootstrap: Front-end framework from Twitter"
        }, done);
      });
    });
  
    describe('for an atmosphere package', function() {
      it("should install the smart package", function(done) {
        runner.invokeMrtInApp('uninstalled-app-with-smart-pkg', ['add', 'mrt-test-pkg1'], {
          waitForOutput: "mrt-test-pkg1: mrt test package 1"
        }, done);
      });
    });
  });
});