var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Package = require('./package');
var Resolver = require('./resolver');

// A list of dependencies.
//
// deps.basePackages are the dependencies that are directly specified.
//   (right now they are specified purely by source. In the future they will have
//    version ranges etc)
//
// deps.packages is a calculated list of packages that is the result of resolving root_packages
//
// deps.resolve() calculates .packages from .root_packages

// root is where packages specified by a path should resolve from (if relative)
Dependencies = function(pkgConfigs) {
  var self = this;
  
  this.basePackages = Package.prepareList(pkgConfigs || {});
};

Dependencies.prototype.isEmpty = function() {
  
  return _.isEmpty(this.basePackages);
};

Dependencies.prototype.resolved = function() {
  
  return this.packages && (this.isEmpty() || !_.isEmpty(this.packages));
};

// are the two set of dependencies built from the same set of basePackages?
// (they could be resolved differently, but that's not our problem right now)
Dependencies.prototype.equalBase = function(otherDeps) {
  var self = this;
  
  // do we have all the same packages
  if (!_.isEqual(_.keys(self.basePackages), _.keys(otherDeps.basePackages)))
    return false;
  
  // are each package the same version?
  return _.all(_.keys(self.basePackages), function(key) {
    return self.basePackages[key].equals(otherDeps.basePackages[key]);
  });
};

Dependencies.prototype.installInto = function(project, fn) {
  if (!this.resolved())
    throw "ERROR: must call resolve before installing dependencies";
  
  // FIXME -- what about removing 'cruft' packages?
  var packages = _.values(this.packages);
  var installed = false;
  var installStep = function(pkg_installed) {
    installed = installed || pkg_installed;
    
    if (_.isEmpty(packages))
      return fn();
    
    packages.shift().installInto(project, installStep);
  }
  installStep();
};

Dependencies.prototype.toJson = function(lock) {
  var data = {};
  
  data.basePackages = {};
  _.each(this.basePackages, function(pkg, name) {
    data.basePackages[name] = pkg.toJson();
  });
  
  if (lock) {
    data.packages = {};
    _.each(this.packages, function(pkg, name) {
      data.packages[name] = pkg.toJson(true);
    });
  }
  
  return data;
};

Dependencies.newFromLockJson = function(lockData) {
  var deps = new Dependencies(lockData.basePackages);
  deps.packages = Package.prepareList(lockData.packages);
  
  return deps;
};

// Resolve basePackages -> packages
Dependencies.prototype.resolve = function(forceDeps, fn) {
  if (_.isFunction(forceDeps)) {
    fn = forceDeps;
    forceDeps = false;
  }
  
  Resolver.resolve(this, forceDeps, fn);
}

module.exports = Dependencies;

// var _debug = require('../debug');
// _.debugClass('Dependencies');
