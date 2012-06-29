var _ = require('underscore');
var path = require('path');
var Repo = require('./repo');

Package = function(package) {
  _.extend(this, package);
  this.repo.path = path.join(Meteorite.root(), 'packages', this.name, this.repo.checkout, this.repo.head);
  
  this.libPath = this.libPath || '.'; // defaults to this.repo.path
  this.libPath = path.resolve(this.repo.path, this.libPath);
};

_.extend(Package.prototype, {
  // once we've fetched the package, we read it's smart.json and update the
  // relevant variables
  update: function(config) {
    if (config.libPath)
      this.libPath = path.resolve(this.repo.path, config.libPath);
  }
});

module.exports = Package;
