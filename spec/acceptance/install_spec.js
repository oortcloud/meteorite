var mrt = require('./helpers');

///// IMPORTANT NOTE!
// All real `install` tests are done on run because `install` is just a subset of `run` but `run` gives us simpler ways to verify behavior.

describe('`mrt install`', function() {
  
  beforeEach(function(done) {
    mrt.cleanup(done);
  });

  // Just a superficial test to make sure install is working
  it("should install meteor and the app's smart package", function(done) {
    mrt.invoke('run', 'app-with-smart-pkg', {
      waitForOutput: [
        "Fetching package mrt-test-pkg1 (branch: master)",
        "Fetching Meteor (branch: master)"
      ]
    }, done);
  })
  
});
