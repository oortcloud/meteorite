var _ = require('underscore');
var path = require('path');
var spawn = require('child_process').spawn;
var fs = require('fs');
var wrench = require('wrench');
var Repo = require('./repo');

Package = function(package) {
  _.extend(this, package);
  this.path = path.join(Meteorite.root(), 'packages', this.name, this.repo.checkout, this.repo.head);
  // TODO rename src to lib
  this.libPath = package.libPath || path.join(this.path, 'src', this.name);
};

_.extend(Package.prototype, Repo);

module.exports = Package;
