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

  _.each(this.packages, function(package) {
    package.fetch(onFetch);
  });
};

Packages.prototype.install = function(meteor, fn) {
  var self = this;
  var installCount = 0;

  var onInstall = function() {
    if (installCount >= _.keys(self.packages).length - 1)
      fn();
    installCount++;
  };

  _.each(this.packages, function(package) {
    meteor.addPackage(package, onInstall);
  });
};

module.exports = Packages;
