var _ = require('underscore');
var assert = require('assert');
var Meteorite = require('../../lib/meteorite');
var Dependencies = require('../../lib/dependencies/dependencies');
require('../lib/mocks/package_mock');
require('../lib/mocks/atmosphere_mock');

describe('The Resolver', function() {
  describe('with a git dependency vs a atmos one', function() {
    var dependencies;
    before(function() {
      dependencies = new Dependencies('/', {
        'A': {'git': 'A.specified'}, 'B': {}
      });
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
    
    it('should use the gitted-A package after resolving', function(done) {
      dependencies.resolve(true, function() {
        assert.equal(dependencies.packages['A'].source.url, 'A.specified');
        done();
      });
    });
  });
  
  describe('with a atmos dependency vs a git one', function() {
    var dependencies;
    before(function() {
      dependencies = new Dependencies('/', {
        'A': {}, 'B': {'git': 'B'}
      });
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
    
    it('should use the gitted-A package after resolving', function(done) {
      dependencies.resolve(true, function() {
        assert.equal(dependencies.packages['A'].source.url, 'A.specified');
        done();
      });
    });
  });
});
