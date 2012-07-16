var mrt = require('./helpers');
var path = require('path');
var fs = require('fs');
var assert = require('assert');

///// IMPORTANT NOTE!
// All real `install` tests are done on `run` because `install` is just a subset of `run` but `run` gives us simpler ways to verify behavior.

describe('invoking `mrt install`', function() {
  
  beforeEach(function(done) {
    mrt.prepare(done);
  });
  afterEach(function(done) {
    mrt.cleanup(done);
  });
  
  describe('in an uninstalled app without a smart.lock', function() {
    
    // Just a superficial test to make sure install is working
    it("should install meteor and the app's smart package", function(done) {
      mrt.invoke('install', 'app-with-smart-pkg', {
        waitForOutput: [
          "Fetching package mrt-test-pkg1 (branch: master)",
          "Fetching Meteor (branch: master)",
          "Installed"
        ]
      }, function() {
        
        var appDir = path.join('spec', 'support', 'apps', 'app-with-smart-pkg');
        assert.ok(fs.existsSync(path.join(appDir, 'smart.lock')), "Didn't create smart.lock");
        assert.ok(fs.existsSync(path.join(appDir, '.meteor', 'meteorite')), "Didn't create meteor directory");
        done();
      });
    });
  })
  
  describe('in an app with a consistent smart.lock and smart.json', function() {
    
    it("should not resolve dependencies", function(done) {
      mrt.copyLockfileToApp('app-with-smart-pkg', 'app-with-smart-pkg')
      mrt.invoke('install', 'app-with-smart-pkg', {
        assertNoOutput: [
          "Resolving",
        ]
      }, function() {

        var appDir = path.join('spec', 'support', 'apps', 'app-with-smart-pkg');
        assert.ok(fs.existsSync(path.join(appDir, '.meteor', 'meteorite')), "Didn't create meteor directory");
        done();
      });
    });
  });
  
  describe('in an app with an out-of-date smart.lock', function() {
    it("should re-resolve dependencies", function(done) {
      mrt.copyLockfileToApp('app-with-smart-pkg-pinned-to-branch', 'app-with-smart-pkg')
      mrt.invoke('install', 'app-with-smart-pkg', {
        waitForOutput: [
          "smart.json changed..",
          "Resolving",
          "Fetching package mrt-test-pkg1 (branch: master)"
        ]
      }, function() {
        
        var appDir = path.join('spec', 'support', 'apps', 'app-with-smart-pkg');
        assert.ok(fs.existsSync(path.join(appDir, 'smart.lock')), "Didn't create smart.lock");
        assert.ok(fs.existsSync(path.join(appDir, '.meteor', 'meteorite')), "Didn't create meteor directory");
        done();
      });
    });
    
  });
});

describe('invoking `mrt update`', function() {
  
  beforeEach(function(done) {
    mrt.prepare(done);
  });
  afterEach(function(done) {
    mrt.cleanup(done);
  });
  
  describe('in an app with a consistent smart.lock and smart.json', function() {
    
    it("should re-resolve dependencies", function(done) {
      mrt.copyLockfileToApp('app-with-smart-pkg', 'app-with-smart-pkg')
      mrt.invoke('update', 'app-with-smart-pkg', {
        waitForOutput: [
          "Resolving",
          "Fetching package mrt-test-pkg1 (branch: master)"
        ]
      }, function() {
        
        var appDir = path.join('spec', 'support', 'apps', 'app-with-smart-pkg');
        assert.ok(fs.existsSync(path.join(appDir, '.meteor', 'meteorite')), "Didn't create meteor directory");
        done();
      });
    });
  });
  
});

describe("invoking `mrt uninstall --system`", function() {

  beforeEach(function(done) {
    mrt.prepare(done);
  });
  
  it("should delete everything in ~/.meteorite", function(done) {
    
    var installDir = path.resolve('spec/support/home/.meteorite');
    
    // put something in there
    if (!fs.existsSync(installDir))
      fs.mkdirSync(installDir);

    // why doesn't this work?
    fs.mkdirSync(path.join(installDir, 'foo'));
    
    assert.equal(fs.existsSync(installDir), true);
    
    mrt.invoke('uninstall --system', 'empty-dir', {
      waitForOutput: 'Deleting ~/.meteorite'
    }, function() {
      assert.equal(fs.existsSync(installDir), false, "~/.meteorite wasn't uninstalled");
      done();
    });
        
  });
});
