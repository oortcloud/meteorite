var _ = require('underscore');
var assert = require('assert');
var Meteorite = require('../../lib/meteorite');
var Dependencies = require('../../lib/dependencies/dependencies');
require('../lib/mocks/package_mock');
require('../lib/mocks/atmosphere_mock');

// fn should check that the correct package was used
var testConflict = function(pkgDefns, fn) {
  var dependencies;
  before(function() {
    dependencies = new Dependencies(pkgDefns);
  });
    
  it('should not resolve when not forced', function(done) {
    dependencies.resolve(function(err, result) {
      assert(err, 'no resolution error thrown');
      done();
    });
  });
    
  it('should resolve when forced', function(done) {
    dependencies.resolve(true, done);
  });
    
  it('should use the correct package after resolving', function(done) {
    dependencies.resolve(true, function() {
      fn(dependencies, done);
    });
  });
}


describe('The Resolver', function() {
  describe('with two local dependencies', function() {
    testConflict({A: {path: '/A'}, B: {path: '/B'}}, 
      function(dependencies, done) {
        assert.equal(dependencies.packages['C'].source.path, '/C.path.A');
        done();
      });
  });
  
  describe('with a local dependency vs a git one', function() {
    testConflict({A: {path: '/A'}, B: {git: 'B'}}, 
      function(dependencies, done) {
        assert.equal(dependencies.packages['C'].source.path, '/C.path.A');
        done();
      });
  });
  
  describe('with a git dependency vs a local one', function() {
    testConflict({A: {git: 'A'}, B: {path: '/B'}}, 
      function(dependencies, done) {
        assert.equal(dependencies.packages['C'].source.path, '/C.path.B');
        done();
      });
  });
  
  describe('with a local dependency vs an atmos one', function() {
    testConflict({A: {path: '/A'}, B: {}}, 
      function(dependencies, done) {
        assert.equal(dependencies.packages['C'].source.path, '/C.path.A');
        done();
      });
  });
  
  describe('with a atmos dependency vs a local one', function() {
    testConflict({A: {}, B: {path: '/B'}}, 
      function(dependencies, done) {
        assert.equal(dependencies.packages['C'].source.path, '/C.path.B');
        done();
      });
  });
  
  describe('with two git dependencies', function() {
    testConflict({'A': {'git': 'A'}, 'B': {'git': 'B'}}, 
      function(dependencies, done) {
        assert.equal(dependencies.packages['C'].source.url, 'C.git.A');
        done();
      });
  });
  
  describe('with a git dependency vs a atmos one', function() {
    testConflict({'A': {'git': 'A'}, 'B': {}}, 
      function(dependencies, done) {
        assert.equal(dependencies.packages['C'].source.url, 'C.git.A');
        done();
      });
  });
  
  describe('with a atmos dependency vs a git one', function() {
    testConflict({'A': {}, 'B': {'git': 'B'}}, 
      function(dependencies, done) {
        assert.equal(dependencies.packages['C'].source.url, 'C.git.B');
        done();
      });
  });
  
  describe('with two atmos dependencies', function() {
    testConflict({'A': {}, 'B': {}}, 
      function(dependencies, done) {
        assert.equal(dependencies.packages['C'].version, '1.C.atmos.A');
        done();
      });
  });
  
  // right now, goes with the first encountered.
  // could be the most recent, in which case, this should be different
  describe('with two atmos dependencies', function() {
    testConflict({'B': {}, 'A': {}}, 
      function(dependencies, done) {
        assert.equal(dependencies.packages['C'].version, '1.C.atmos.B');
        done();
      });
  });
    
});
