var mrt = require('./helpers');

var shouldInstall = function(baseName) {
  describe('for a meteor package', function() {
    it("should install the smart package", function(done) {
      mrt.invokeInNew('add bootstrap', baseName, {
        waitForOutput: "bootstrap: UX/UI framework from Twitter"
      }, done);
    });
  });
  
  describe('for an atmosphere package', function() {
    it("should install the smart package", function(done) {
      mrt.invokeInNew('add mrt-test-pkg1', baseName, {
        waitForOutput: "mrt-test-pkg1: mrt test package 1 v1.7.0"
      }, done);
    });
  });
  
  describe('for a versioned atmosphere package', function() {
    it("should install the versioned smart package", function(done) {
      mrt.invokeInNew('add mrt-test-pkg1 --pkg-version 1.4.0', baseName, {
        waitForOutput: "mrt-test-pkg1: mrt test package 1 v1.4.0"
      }, done);
    });
  });
};

describe('invoking `mrt add`', function() {
  
  beforeEach(function(done) {
    mrt.prepare(done);
  });
  
  afterEach(function(done) {
    mrt.cleanup(done);
  });
  
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
        mrt.invokeInNew('add bootstrap', 'uninstalled-app-with-smart-pkg', {
          waitForOutput: "bootstrap: UX/UI framework from Twitter"
        }, done);
      });
    });

    describe('for an atmosphere package', function() {
      it("should install the smart package", function(done) {
        mrt.invokeInNew('add mrt-test-pkg1', 'uninstalled-app-with-smart-pkg', {
          waitForOutput: "mrt-test-pkg1: mrt test package 1"
        }, done);
      });
    });
  });
});