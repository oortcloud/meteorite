var mrt = require('./helpers');

describe('invoking `mrt run`', function() {
  
  beforeEach(function(done) {
    mrt.prepare(done);
  });
  
  describe('with a smart.json linking', function() {
    
    describe('a single atmosphere package', function() {
      it("should install the smart package", function(done) {
        mrt.invoke('run', 'app-with-atmos-pkg', {
          waitForOutput: "Test package 1 installed (branch/master)"
        }, done);
      });
    });
  });
});