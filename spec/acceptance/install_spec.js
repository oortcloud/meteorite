var runner = require('../lib/runner.js');
var utils = require('../lib/utils.js');
var path = require('path');
var fs = require('fs');
var assert = require('assert');

///// IMPORTANT NOTE!
// All real `install` tests are done on `run` because `install` is just a subset of `run` but `run` gives us simpler ways to verify behavior.

describe('invoking `mrt install`', function() {
  describe('in an uninstalled app without a smart.lock', function() {
    
    // Just a superficial test to make sure install is working
    it("should install meteor and the app's smart package", function(done) {
      var appName = 'app-with-smart-pkg';
      var appDir = path.join(utils.appHome, appName);
      
      runner.invokeMrtInApp(appName, ['install'], {
        waitForOutput: [
          "mrt-test-pkg1",
          "branch: https://github.com/possibilities/mrt-test-pkg1.git#master",
          "Installing Meteor",
          "branch: https://github.com/meteor/meteor.git#master",
          "Done installing smart packages"
        ]
      }, function() {
        assert.ok(fs.existsSync(path.join(appDir, 'smart.lock')), "Didn't create smart.lock in " + appDir);
        assert.ok(fs.existsSync(path.join(appDir, 'packages', 'mrt-test-pkg1')), "Didn't link meteor package");
        done();
      });
    });
  });
  
  describe('in an app with a consistent smart.lock and smart.json', function() {
    
    it("should not resolve dependencies", function(done) {
      var appName = 'app-with-smart-pkg';
      var appDir = path.join(utils.appHome, appName);
      
      runner.invokeMrtInApp(appName, ['install'], {
        withLockFile: 'app-with-smart-pkg',
        assertNoOutput: [
          "Resolving dependency tree"
        ]
      }, function() {

        assert.ok(fs.existsSync(path.join(appDir, 'packages', 'mrt-test-pkg1')), "Didn't link meteor package");
        done();
      });
    });
  });
  
  describe('in an app with an out-of-date smart.lock', function() {
    it("should re-resolve dependencies", function(done) {
      
      var appName = 'app-with-smart-pkg';
      var appDir = path.join(utils.appHome, appName);
      
      runner.invokeMrtInApp(appName, ['install'], {
        withLockFile: 'app-with-smart-pkg-pinned-to-branch',
        waitForOutput: [
          "smart.json changed",
          "Resolving dependency tree",
          "mrt-test-pkg1",
          "branch: https://github.com/possibilities/mrt-test-pkg1.git#master",
          "Done installing smart packages"
        ]
      }, function() {
        
        assert.ok(fs.existsSync(path.join(appDir, 'smart.lock')), "Didn't create smart.lock");
        assert.ok(fs.existsSync(path.join(appDir, 'packages', 'mrt-test-pkg1')), "Didn't link meteor package");
        done();
      });
    });
  });
  
  describe('in an app with an out-of-date meteor in smart.lock', function() {
    it("should re-resolve dependencies", function(done) {
      
      var appName = 'app-with-smart-pkg';
      var appDir = path.join(utils.appHome, appName);
      
      runner.invokeMrtInApp(appName, ['install'], {
        withLockFile: 'app-with-meteor-pinned-to-branch',
        waitForOutput: [
          "smart.json changed",
          "Resolving dependency tree",
          "Done installing smart packages"
        ]
      }, function() {
        
        assert.ok(fs.existsSync(path.join(appDir, 'smart.lock')), "Didn't create smart.lock");
        assert.ok(fs.existsSync(path.join(appDir, 'packages', 'mrt-test-pkg1')), "Didn't link meteor package");
        done();
      });
    });
  });
});

describe('invoking `mrt update`', function() {
  describe('in an app with a consistent smart.lock and smart.json', function() {
    
    it("should re-resolve dependencies", function(done) {
      var appName = 'app-with-smart-pkg';
      var appDir = path.join(utils.appHome, appName);
      
      runner.invokeMrtInApp(appName, ['install'], {
        withLockFile: 'app-with-smart-pkg',
        waitForOutput: [
          "Resolving dependency tree",
          "mrt-test-pkg1",
          "branch: https://github.com/possibilities/mrt-test-pkg1.git#master",
          "Done installing smart packages"
        ]
      }, function() {
        
        assert.ok(fs.existsSync(path.join(appDir, 'packages', 'mrt-test-pkg1')), "Didn't link meteor package");
        done();
      });
    });
  });
});

describe("invoking `mrt uninstall --system`", function() {
  it("should delete everything in ~/.meteorite", function(done) {
    
    var installDir = path.join(utils.appHome, '.meteorite');
    
    // put something in there
    if (!fs.existsSync(installDir))
      fs.mkdirSync(installDir);

    // why doesn't this work?
    fs.mkdirSync(path.join(installDir, 'foo'));
    
    assert.equal(fs.existsSync(installDir), true);
    
    runner.invokeMrt('', ['uninstall', '--system'], {
      waitForOutput: 'Deleting ~/.meteorite'
    }, function() {
      assert.equal(fs.existsSync(installDir), false, "~/.meteorite wasn't uninstalled");
      done();
    });
        
  });
});
