var _ = require('underscore');
var assert = require('assert');
var Meteorite = require('../../lib/meteorite');
var Dependencies = require('../../lib/dependencies/dependencies');
require('../lib/mocks/package_mock');
require('../lib/mocks/project_mock');

var project = new ProjectMock();

// TODO -- should this be in dependencies?
var assertDependenciesEqual = function(deps1, deps2) {
  
  assert.ok(deps1.equalBase(deps2), 'different base package lists');
  
  // need to ensure these have the same commit refs too
  assert.ok(_.isEqual(_.keys(deps1.packages), _.keys(deps2.packages)), 'different package lists!');
  
  // are each package the same version? TODO -- check that this is checking this
  var allSame = _.all(_.keys(deps1.packages), function(key) {
    return deps1.packages[key].equals(deps2.packages[key]);
  });
  assert.ok(allSame, 'mis-matched packages lists');
};

describe('Writing smart.lock', function() {
  describe('for dependencies with no basePackages', function() {
    var deps, expected;
    before(function(done) {
      
      expected = {packages: {}, basePackages: {}};
      
      deps = new Dependencies(expected.basePackages);
      deps.resolve(done);
    });
    
    it('Should output empty lockJson', function() {
      assert.ok(_.isEqual(expected, deps.toJson(true)), 'Unexpected lock JSON');
    });
    
    it('Should recreate from empty lockJson', function() {
      var newDeps = Dependencies.newFromLockJson(expected);
      
      assert.ok(_.isEqual(deps, newDeps), 'non-equal Dependencies object');
    });
  });
  
  describe('for dependencies with trivial basePackages', function() {
    var deps, expected;
    before(function(done) {
      
      expected = {
        packages: {
          "mrt-test-pkg1": {
            "git": "https://github.com/possibilities/mrt-test-pkg1.git",
            "branch": "master",
            "commit": "3ab9c811313dbedc48269f39a78b86617653fa91"
          }
        }, 
        basePackages: {
          "mrt-test-pkg1": {
            "git": "https://github.com/possibilities/mrt-test-pkg1.git",
            "branch": "master"
          }
        }
      };
      
      deps = new Dependencies(expected.basePackages);
      deps.resolve(done);
    });
    
    it('Should output correct lockJson', function() {
      assert.ok(_.isEqual(expected, deps.toJson(true)), 'Unexpected lock JSON');
    });
    
    it('Should recreate from lockJson', function() {
      var newDeps = Dependencies.newFromLockJson(expected);
      
      assertDependenciesEqual(deps, newDeps);
    });
  });
  
  describe('for dependencies with more complex basePackages', function() {
    var deps, expected;
    before(function(done) {
      
      expected = {
        packages: {
          "mrt-test-pkg2": {
            "git": "https://github.com/possibilities/mrt-test-pkg2.git",
            "branch": "master",
            "commit": "223e2266b1c593abcdeaace1d5b0955b372e0f34"
          },
          "mrt-test-pkg1": {
            "git": "https://github.com/possibilities/mrt-test-pkg1.git",
            "branch": "master",
            "commit": "3ab9c811313dbedc48269f39a78b86617653fa91"
          }
        }, 
        basePackages: {
          "mrt-test-pkg2": {
            "git": "https://github.com/possibilities/mrt-test-pkg2.git",
            "branch": "master"
          }
        }
      };
      
      deps = new Dependencies(expected.basePackages);
      deps.resolve(done);
    });
    
    it('Should output correct lockJson', function() {
      assert.ok(_.isEqual(expected, deps.toJson(true)), 'Unexpected lock JSON');
    });
    
    it('Should recreate from lockJson', function() {
      var newDeps = Dependencies.newFromLockJson(expected);
      
      assertDependenciesEqual(deps, newDeps);
    });
  });
  
  describe('when depending on a local package with a local dependency', function() {
    var deps, expected;
    before(function(done) {
      
      expected = {
        packages: {
          "mrt-test-pkg2": {
            "path": "../../mrt-test-pkg2"
          },
          "mrt-test-pkg1": {
            // pkg2 has a link to ../mrt-test-pkg1, so when it resolves, it
            // should be two levels up
            "path": "../../mrt-test-pkg1"
          }
        }, 
        basePackages: {
          "mrt-test-pkg2": {
            "path": "../../mrt-test-pkg2"
          }
        }
      };
      
      deps = new Dependencies(expected.basePackages);
      deps.resolve(done);
    });
    
    it('Should output correct lockJson', function() {
      assert.ok(_.isEqual(expected, deps.toJson(true)), 'Unexpected lock JSON');
    });
    
    it('Should recreate from lockJson', function() {
      var newDeps = Dependencies.newFromLockJson(expected);
      
      assertDependenciesEqual(deps, newDeps);
    });
  });
  
  
});