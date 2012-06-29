var path = require('path');
var _ = require('underscore');
_.str = require('underscore.string');
var Repo = require('./repo');
var fs = require('fs');
var fstream = require('fstream');
var wrench = require('wrench');

Meteor = function(config) {
  this._prepare(config);
  this.repo.path = path.join(Meteorite.root(), 'meteors', this.repo.checkout, this.repo.head);
};

Meteor.prototype.installApp = function(appRoot, fn) {
  var self = this;
  var appKey = _.slugify(appRoot);
  this.installRoot = path.join(Meteorite.root(), 'apps', appKey);
  this.packagesRoot = path.join(this.installRoot, 'packages');

  if (path.existsSync(this.installRoot))
    wrench.rmdirSyncRecursive(this.installRoot);

  wrench.mkdirSyncRecursive(this.installRoot);

  var reader = fstream.Reader(this.repo.path);
  var writer = fstream.Writer(this.installRoot);

  writer.on('close', fn)
  reader.pipe(writer);
};

Meteor.prototype.addPackage = function(package) {
  var packagePath = path.join(this.packagesRoot, package.name);

  if (!path.existsSync(packagePath))
    fs.symlinkSync(package.libPath, packagePath);
};

Meteor.prototype._prepare = function(config) {
  config.git || (config.git = 'https://github.com/meteor/meteor.git');
  this.repo = new Repo(config);
};

module.exports = Meteor;
