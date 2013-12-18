var runner = require('../lib/runner.js');

describe('invoking `mrt run`', function() {
  describe('with a smart.json linking', function() {
    
    describe('a single atmosphere package', function() {
      it("should install the smart package", function(done) {
        runner.invokeMrtInApp('app-with-atmos-pkg', ['run'], {
          waitForOutput: "Test package 1 installed - v0.2.0"
        }, done);
      });
    });
  });
});