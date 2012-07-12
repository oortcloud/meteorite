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
      pkg.prepare(self.project, onFetch);
    else
      pkg.fetch(self.project, onFetch);

  });

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
