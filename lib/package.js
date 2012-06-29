var _ = require('underscore');
var path = require('path');
var spawn = require('child_process').spawn;
var fs = require('fs');
var wrench = require('wrench');
var Repo = require('./repo');

Package = function(package) {
  _.extend(this, package);
  this.path = path.join(Meteorite.root(), 'packages', this.name, this.repo.checkout, this.repo.head);
  
  this.libPath = this.libPath || '.'; // defaults to this.path
  this.libPath = path.resolve(this.path, this.libPath);
};

_.extend(Package.prototype, Repo);

_.extend(Package.prototype, {
  // once we've fetched the package, we read it's smart.json and update the
  // relevant variables
  update: function(config) {
    if (config.libPath)
      this.libPath = path.resolve(this.path, config.libPath);
  }
});

module.exports = Package;
