var _ = require('underscore');
var Meteorite = require('./meteorite');
var Package = require('./package');
var path = require('path');

Packages = function(project, configs) {
  var self = this;
  
  this.project = project;
  configs = configs || project.config.packages;

  // Create a package list from configs
  this.packages = _.reduce(configs, function(packages, config, name) {
    
    // If the package is specified by path resolve it relative 
    // to the project root
    if (config.path)
      config.path = path.resolve(self.project.root, config.path);
    
    // Create package object and store it in `this.packages`
    packages[name] = new Package(name, config);
    
    // Pass it on
    return packages;

  }, {});

};

Packages.prototype.fetch = function(fn) {
  // If there's no packages have a beer and continue
  if (_.isEmpty(this.packages))
    return fn();

  var self = this;
  var fetchCount = 0;

  // Keep track of how many packages we've fetched so
  // we know when we're done
  var onFetch = function() {
    if (fetchCount >= _.keys(self.packages).length - 1)
      fn();
    fetchCount++;
  };
  
  // Fetch each package and process it
  _.each(this.packages, function(pkg, name) {

    if (self.project.hasPackage(pkg))
      return onFetch();

    if (pkg.source.isLoaded()) {
      onFetch();
    } else {
      pkg.fetch(function() {
        // If package has it's own dependencies we need to get them
        if (pkg.hasSmartJson()) {

          // Make a config object from package's `smart.json`
          var config = new Config(pkg.libPath());

          // Process sub-dependencies
          var packages = new Packages(self.project, config.packages);
          pkg.packages = packages.packages;
          packages.fetch(onFetch);

        } else {

          // Ok we fetched it, make a note of it
          onFetch();
        }
      });
    }

  });

};

Packages.prototype.installInto = function(project, fn) {
  
  // Walk the tree of dependencies and callback with each one
  var walkDependencyTree = function(packages, eachStep) {
    _.each(packages, function(pkg) {
      eachStep(pkg);
      if (pkg.packages) {
        walkDependencyTree(pkg.packages, eachStep);
      }
    });
    eachStep();
  };

  // Go ahead and walk dependency tree and add each
  // package to the project
  walkDependencyTree(this.packages, function(pkg) {
    if (pkg)
      pkg.installInto(project);
  });
  
  fn();
};

module.exports = Packages;
