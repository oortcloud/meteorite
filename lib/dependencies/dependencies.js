var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Package = require('./package');

// A list of dependencies.
//
// deps.base_packages are the dependencies that are directly specified.
//   (right now they are specified purely by source. In the future they will have
//    version ranges etc)
//
// deps.packages is a calculated list of packages that is the result of resolving root_packages
//
// deps.resolve() calculates .packages from .root_packages

// root is where packages specified by a path should resolve from (if relative)
Dependencies = function(root, pkgConfigs) {
  var self = this;
  
  this.base_packages = Package.prepareList(root, pkgConfigs);
};

Dependencies.prototype.resolved = function() {
  
  // only false if this.packages is empty and base_packages isn't
  return this.packages && _.size(this.packages) >= _.size(this.base_packages);
};

// are the two set of dependencies built from the same set of base_packages?
// (they could be resolved differently, but that's not our problem right now)
Dependencies.prototype.equalBase = function(otherDeps) {
  var self = this;
  
  // do we have all the same packages
  if (!_.isEqual(_.keys(self.base_packages), _.keys(otherDeps.base_packages)))
    return false;
  
  // are each package the same version?
  return _.all(_.keys(self.base_packages), function(key) {
    return self.base_packages[key].equals(otherDeps.base_packages[key]);
  });
};


// In the process of resolving we fetch all packages
Dependencies.prototype.fetch = function(fn) {
  this.resolve(fn);
};

// FIXME -- right now assumes you've called resolve already.
Dependencies.prototype.installInto = function(project, fn) {

  if (_.isEmpty(this.packages) && !_.isEmpty(this.base_packages))
    throw "ERROR: must call resolve before installing dependencies";
  
  _.each(this.packages, function(pkg) {
    pkg.installInto(project);
  });
  
  fn();
};

Dependencies.prototype.lockJson = function() {
  var data = {basePackages: {}, packages: {}};
  
  _.each(this.base_packages, function(pkg, name) {
    data.basePackages[name] = pkg.toJson(true);
  });

  _.each(this.packages, function(pkg, name) {
    data.packages[name] = pkg.toJson(true);
  });
  
  return data;
};

// write out into smart.lock
Dependencies.prototype.writeLockFile = function(project) {
  
  var smartJsonString = JSON.stringify(this.lockJson(), null, 2) + "\n";
  fs.writeFileSync(project.lockFilename(), smartJsonString);
};

// read in a smart.lock
Dependencies.newFromLockFile = function(project) {
  
  var data = fs.readFileSync(project.lockFilename()).toString();
  var lockData = JSON.parse(data);
  
  var deps = new Dependencies(project.root, lockData.basePackages);
  deps.packages = Package.prepareList(project.root, lockData.packages);
  
  return deps;
};

// Resolve base_packages -> packages
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
  var unresolved = _.extend({}, this.base_packages);
  // the list of packages that we are going to have to install
  self.packages = {};
  
  // recurse until we've resolved all packages
  var resolve_step = function() {
    // base case
    if (_.isEmpty(unresolved))
      return fn();
    
    // is there an easy way to pluck the first value from an object?
    var resolving_pkg = _.find(unresolved, _.identity);
    var name = resolving_pkg.name;
    delete unresolved[name];
    
    // let's add this package to the list of packages and all it's dependencies to unresolved
    // (we know it's not in there, because we checked before adding it to unresolved)
    self.packages[name] = resolving_pkg;
    
    // we need to read and resolve all dependencies, then it's simply:
    resolving_pkg.readDependencies(function() {
      resolving_pkg.dependencies.resolve(function() {
        
        _.each(resolving_pkg.dependencies.packages, function(new_pkg, new_pkg_name) {
          
          // if the package is already in our package list or is already pending
          // we don't need to add it, but we do need to ensure compatibility
          var matched;
          if (new_pkg_name in self.packages)
            matched = self.packages[new_pkg_name];
          if (new_pkg_name in unresolved)
            matched = unresolved[new_pkg_name];
            
          if (matched) {
            // we don't have to do anything, but we better make sure it's compatible
            if (!matched.equals(resolving_pkg)) {
            
              // TODO -- better error reporting
              throw "Can't resolve dependencies! Two versions of " + new_pkg_name + " depended on!";
            }
          
          } else {
            unresolved[new_pkg_name] = new_pkg;
          }
        });
        
        // ok, after dealing with all the dependencies, we are ready to move to the next pkg
        resolve_step();
      });
    });
  }; // end resolve_step
    
  // do it
  resolve_step();
};

module.exports = Dependencies;
