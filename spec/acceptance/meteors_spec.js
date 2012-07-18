var mrt = require('./helpers');

describe('invoking `mrt run`', function() {
  
  beforeEach(function(done) {
    mrt.prepare(done);
  });

  describe('in a meteorite project', function() {

    describe('and the smart.json specifies a meteor fork pinned to a specific branch', function() {
      it("should run the forked meteor checked out to the branch", function(done) {
        mrt.invoke('run', 'app-with-meteor-pinned-to-branch', {
          waitForOutput: "Meteor is instrumented for meteorite test (branch/mrt-branch-test)"
        }, done);
      });
    });
    
    describe('and the smart.json specifies a meteor fork pinned to a specific tag', function() {
      it("should run the forked meteor checked out to the branch", function(done) {
        mrt.invoke('run', 'app-with-meteor-pinned-to-tag', {
          waitForOutput: "Meteor is instrumented for meteorite test (tag/mrt-test-tag)"
        }, done);
      });
    });
    
    describe('and the smart.json specifies a meteor fork pinned to a specific ref', function() {
      it("should run the forked meteor checked out to the branch", function(done) {
        mrt.invoke('run', 'app-with-meteor-pinned-to-ref', {
          waitForOutput: "Meteor is instrumented for meteorite test (ref)"
        }, done);
      });
    });
    
  });

});
