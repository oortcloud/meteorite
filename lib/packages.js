var _ = require('underscore');
var Package = require('./package');

Packages = function(project, configs) {
  this.project = project;
  configs = configs || project.config.packages;

  // Create a package list from configs
  this.packages = _.reduce(configs, function(packages, config, name) {

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

    if (pkg.source.isLoaded())
      self.preparePackage(pkg, onFetch);
    else
      self.fetchPackage(name, pkg, onFetch);

  });

};

Packages.prototype.fetchPackage = function(name, pkg, fn) {
  var self = this;

  console.log('Fetching package ' + name + ' ' + pkg.source + '...');

  // Fetch the package source
  pkg.source.fetch(function() {
    self.preparePackage(pkg, fn);
  });
  
};

Packages.prototype.preparePackage = function(pkg, fn) {
  var self = this;

  // If package has it's own dependencies we need to get them
  if (pkg.hasSmartJson()) {
    
    // Make a config object from package's `smart.json`
    var config = new Config(pkg.libPath());

    // Process sub-dependencies
    var packages = new Packages(self.project, config.packages);
    pkg.packages = packages.packages;
    packages.fetch(fn);

  } else {
    
    // Ok we fetched it, make a note of it
    fn();
  }
};

Packages.prototype.installInto = function(project, fn) {
  
  // Walk the tree of dependencies and callback with each one
  var walkDependencyTree = function(packages, _fn) {
    _.each(packages, function(pkg) {
      _fn(pkg);
      if (pkg.packages) {
        walkDependencyTree(pkg.packages, _fn);
      }
    });
    _fn();
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
