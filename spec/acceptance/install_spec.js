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
  
  // Just a superficial test to make sure install is working
  it("should install meteor and the app's smart package", function(done) {
    mrt.invoke('run', 'app-with-smart-pkg', {
      waitForOutput: [
        "Fetching package mrt-test-pkg1 (branch: master)",
        "Fetching Meteor (branch: master)"
      ]
    }, done);
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
