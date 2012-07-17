var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Package = require('./package');

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
Dependencies = function(root, pkgConfigs) {
  var self = this;
  
  this.basePackages = Package.prepareList(root, pkgConfigs);
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


// In the process of resolving we fetch all packages
Dependencies.prototype.fetch = function(fn) {
  
  // is there a generic way to chain callbacks together like this?
  var packages = _.values(this.packages);
  var fetchStep = function() {
    if (_.isEmpty(packages))
      return fn();
    
    packages.shift().fetch(fetchStep);
  };
  
  fetchStep();
};

// FIXME -- right now assumes you've called resolve already.
Dependencies.prototype.installInto = function(project, fn) {

  if (!this.resolved())
    throw "ERROR: must call resolve before installing dependencies";
  
  // FIXME -- what about removing 'cruft' packages?
  //  -- potentially we can live with this until we don't need to install anymore
  _.each(this.packages, function(pkg) {
    pkg.installInto(project);
  });
  
  fn();
};

Dependencies.prototype.lockJson = function() {
  var data = {basePackages: {}, packages: {}};
  
  _.each(this.basePackages, function(pkg, name) {
    data.basePackages[name] = pkg.toJson();
  });

  _.each(this.packages, function(pkg, name) {
    data.packages[name] = pkg.toJson(true);
  });
  
  return data;
};

// read in a smart.lock
Dependencies.newFromLockJson = function(project, lockData) {
  
  var deps = new Dependencies(project.root, lockData.basePackages);
  deps.packages = Package.prepareList(project.root, lockData.packages);
  
  return deps;
};

// Resolve basePackages -> packages
//
// The algorithm can be pretty simple right now.
// Basically we just walk through a list of 'unresolved' packages and
// check the dependencies of each one.
//
// If there's a dependency that's already been resolved or is on the unresolved
// list, we just check if it's the "same" version (ie. github url etc).
// if not, we chuck a fit. If so, we can just forget about it.
//
// In the future we will need to be a _lot_ smarter about this.
// REMINDER: bundler does a "prolog"-style save-pointed search for resolution.
Dependencies.prototype.resolve = function(fn) {
  var self = this;
  
  // packages we still need to check
  var unresolved = _.extend({}, this.basePackages);
  // the list of packages that we are going to have to install
  self.packages = {};
  
  // recurse until we've resolved all packages
  var resolveStep = function() {
    // base case
    if (_.isEmpty(unresolved))
      return fn();
    
    // is there an easy way to pluck the first value from an object?
    var resolvingPkg = _.find(unresolved, _.identity);
    var name = resolvingPkg.name;
    delete unresolved[name];
    
    // let's add this package to the list of packages and all it's dependencies to unresolved
    // (we know it's not in there, because we checked before adding it to unresolved)
    self.packages[name] = resolvingPkg;
    
    // we need to read and resolve all dependencies, then it's simply:
    resolvingPkg.readDependencies(function() {
      resolvingPkg.dependencies.resolve(function() {
        
        _.each(resolvingPkg.dependencies.packages, function(newPkg, newPkgName) {
          
          // if the package is already in our package list or is already pending
          // we don't need to add it, but we do need to ensure compatibility
          var matched;
          if (newPkgName in self.packages)
            matched = self.packages[newPkgName];
          if (newPkgName in unresolved)
            matched = unresolved[newPkgName];
            
          if (matched) {
            // we don't have to do anything, but we better make sure it's compatible
            if (!matched.equals(newPkg)) {
            
              // TODO -- better error reporting
              throw "Can't resolve dependencies! Two versions of " + newPkgName + " depended on!";
            }
          
          } else {
            unresolved[newPkgName] = newPkg;
          }
        });
        
        // ok, after dealing with all the dependencies, we are ready to move to the next pkg
        resolveStep();
      });
    });
  }; // end resolve_step
    
  // do it
  resolveStep();
};

module.exports = Dependencies;
