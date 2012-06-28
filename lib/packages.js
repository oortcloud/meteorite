var _ = require('underscore');
var Package = require('./package');

Packages = function(configs) {
  this.packages = {};

  _.each(configs, function(config, name) {

    this.packages[name] = new Package({
      name: name,
      repo: {
        checkout: 'branch',
        head: (config.branch || config.ref || config.tag || 'master'),
        url: config.git
      }
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
    package.fetch(function() {
      var config = new Config(package.path);
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

  var firstBlood = true;
  walkPackagesTree(this.packages, function(package) {
    if (package) {
      console.log('Meteor :: Add ::', package.name);
      meteor.addPackage(package);
    } else if (firstBlood) {
      firstBlood = false;
      setTimeout(function() { fn(); }, 10000);
    }
  });
};

module.exports = Packages;
