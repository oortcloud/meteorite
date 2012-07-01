var _ = require('underscore');
var Package = require('./package');

Packages = function(configs) {

  // Create a package list from configs
  this.packages = _.reduce(configs, function(packages, config, name) {

    // Create package object and store it in `this.packages`
    packages[name] = new Package({
      name: name,
      repo: new Repo(config)
    });

    // Pass it on
    return packages;

  }, {});

};

Packages.prototype.fetch = function(fn) {
  
  console.log('Fetching packages..');
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
  _.each(this.packages, function(package, name) {

    // Fetch the package repo
    package.repo.fetch(function() {
      
      // Make a config object from package's `smart.json`
      var config = new Config(package.repo.path);

      // If package has it's own dependencies we need to get them
      if (config.packages) {
        
        // Process sub-dependencies
        var packages = new Packages(config.packages);
        package.packages = packages.packages;
        packages.fetch(onFetch);

      } else {
        
        // Ok we fetched it, make a note of it
        onFetch();
      }
    });
  });

};

Packages.prototype.install = function(project, fn) {
  
  // Walk the tree of dependencies and callback with each one
  var walkDependencyTree = function(packages, _fn) {
    _.each(packages, function(package) {
      _fn(package);
      if (package.packages) {
        walkDependencyTree(package.packages, _fn);
      }
    });
    _fn();
  };

  // Go ahead and walk dependency tree and add each
  // package to the project
  walkDependencyTree(this.packages, function(package) {
    if (package) {
      package.install(project);
    }
  });
};

module.exports = Packages;
