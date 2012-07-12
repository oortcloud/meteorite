var mrt = require('./helpers');

describe('invoking `mrt create`', function() {
  beforeEach(function(done) {
    mrt.prepare(done);
  });
  
  afterEach(function(done) {
    mrt.cleanup(done);
  });
  
  it("should create an app from the default branch of meteor", function(done) {
    mrt.invoke('create app-from-default-meteor', 'new_apps', {
      waitForOutput: ['Fetching Meteor (branch: master)', 'app-from-default-meteor: created']      
    }, done);
  });
});