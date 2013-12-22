var async = require('async');
var runner = require('../lib/runner.js');
var atmosphere = require('../lib/atmosphere.js');
var assert = require('assert');

describe('invoking `mrt run`', function() {
  describe('with a smart.json linking', function() {
    
    describe('a single atmosphere package', function() {
      it("should install the smart package", function(done) {
        var tasks = [], installCount = 0;
        
        tasks.push(function(next) {
          atmosphere.getPackageInstallCount('mrt-test-pkg1', '0.2.0', function(err, count) {
            if (err)
              return done(err);
            
            installCount = count;
            next();
          })
        });
        
        tasks.push(function(next) {
          runner.invokeMrtInApp('app-with-atmos-pkg', ['run'], {
            waitForOutput: "Test package 1 installed - v0.2.0"
          }, next);
        })
        
        tasks.push(function(next) {
          atmosphere.getPackageInstallCount('mrt-test-pkg1', '0.2.0', function(err, count) {
            if (err)
              return done(err);
            
            assert.equal(count, installCount + 1);
            next();
          })
        });
        
        tasks.push(function() { done(); });
        
        async.series(tasks);
      });
    });
  });
});