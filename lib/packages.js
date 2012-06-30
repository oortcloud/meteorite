var _ = require('underscore');
var Package = require('./package');

Packages = function(configs) {
  this.packages = {};

  _.each(configs, function(config, name) {

    this.packages[name] = new Package({
      name: name,
      repo: new Repo(config)
    });

  }, this);
};

Packages.prototype.fetch = function(fn) {
  var self = this;
  var fetchCount = 0;

  var onFetch = function() {
    if (fetchCount >= _.keys(self.packages).length - 1)
      fn();
    fetchCount++;
  };

  _.each(this.packages, function(package, name) {
    package.repo.fetch(function() {
      var config = new Config(package.repo.path);
      if (config.packages) {
        var packages = new Packages(config.packages);
        package.packages = packages.packages;
        packages.fetch(onFetch);
      } else {
        onFetch();
      }
    });
  });
};

Packages.prototype.install = function(meteor, fn) {
  var walkPackagesTree = function(packages, _fn) {
    _.each(packages, function(package) {
      _fn(package);
      if (package.packages) {
        walkPackagesTree(package.packages, _fn);
      }
    });
    _fn();
  };

  walkPackagesTree(this.packages, function(package) {
    if (package) {
      meteor.addPackage(package);
    }
  });
};

module.exports = Packages;
