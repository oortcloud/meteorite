var async = require('async');
var runner = require('../lib/runner.js');
var atmosphere = require('../lib/atmosphere.js');
var async = require('async');

describe('invoking `mrt run`', function() {
  describe('with a smart.json linking', function() {
    describe('a single atmosphere package', function() {
      it("should install the smart package", function(done) {
        var tasks = [];
        
        // the first time should install the package into the project
        tasks.push(function(next) {
          atmosphere.assertIncreasesInstallCount('mrt-test-pkg1', '0.2.0', 1, next, function(next) {
            runner.invokeMrtInApp('app-with-atmos-pkg', ['run'], {
              waitForOutput: "Test package 1 installed - v0.2.0"
            }, next);
          });
        })
        
        // the second time should not
        tasks.push(function(next) {
          atmosphere.assertIncreasesInstallCount('mrt-test-pkg1', '0.2.0', 0, next, function(next) {
            runner.invokeMrtInApp('app-with-atmos-pkg', ['run'], {
              waitForOutput: "Test package 1 installed - v0.2.0"
            }, next);
          });
        })
        
        tasks.push(function() { done(); });
        
        async.series(tasks);
      });
    });
  });
});