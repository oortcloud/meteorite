var mrt = require('./helpers');

var shouldInstall = function(baseName) {
  describe('for a meteor package', function() {
    it("should install the smart package", function(done) {
      mrt.invokeInNew('add bootstrap', 'app-without-smart-json', {
        waitForOutput: "bootstrap: UX/UI framework from Twitter"
      }, done);
    });
  });
  
  describe('for an atmosphere package', function() {
    it("should install the smart package", function(done) {
      mrt.invokeInNew('add mrt-test-pkg1', 'app-without-smart-json', {
        waitForOutput: waitForOutput: [
            "Fetching package mrt-test-pkg1 (tag: 1.3.0)...",
            "mrt-test-pkg1: mrt test package 1"
          ]
        }, done);
    });
  });
  
  // TODO -- update this when mike has pushed this to atmos
  describe('for a versioned atmosphere package', function() {
    it("should install the versioned smart package", function(done) {
      mrt.invokeInNew('add mrt-test-pkg1 --pkg-version 1.2.0', 'app-without-smart-json', {
        waitForOutput: [
            "Fetching package mrt-test-pkg1 (tag: 1.2.0)...",
            "mrt-test-pkg1: mrt test package 1"
          ]
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
    shouldInstall('uninstalled-app-with-smart-pkg');
  });
});