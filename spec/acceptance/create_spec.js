var mrt = require('./helpers');

// TODO -- these tests should probably use alternate versions of meteor which output
// different things rather than relying on 'fetching meteor' type messages
//
// TODO -- test the smart.json created
// TODO -- test with path

describe('invoking `mrt create`', function() {
  beforeEach(function(done) {
    mrt.prepare(done);
  });
  
  afterEach(function(done) {
    mrt.cleanup(done);
  });
  
  describe('with no arguments', function() {
    it("should create an app from the default branch of meteor", function(done) {
      mrt.invoke('create app-from-default-meteor', 'new_apps', {
        waitForOutput: ['Fetching Meteor (branch: master)', 'app-from-default-meteor: created']      
      }, done);
    });
  });
  
  describe('with a --branch argument', function() {
    it("should create an app from a non-default branch", function(done) {
      mrt.invoke('create --branch=devel app-from-non-default-meteor', 'new_apps', {
        waitForOutput: ['Fetching Meteor (branch: devel)', 'app-from-non-default-meteor: created']      
      }, done);
    });
  });
});