var spawn = require('child_process').spawn;
var path = require('path');
var _ = require('underscore');
_.str = require('underscore.string');
var Repo = require('./repo');
var fs = require('fs');
var fstream = require('fstream');
var wrench = require('wrench');

Meteor = function(config) {
  this._prepare(config);
  this.path = path.join(Meteorite.root(), 'meteors', this.repo.checkout, this.repo.head);
};

_.extend(Meteor.prototype, Repo);

Meteor.prototype.installApp = function(appRoot, fn) {
  var self = this;
  var appKey = _.slugify(appRoot);
  this.installRoot = path.join(Meteorite.root(), 'apps', appKey);
  this.packagesRoot = path.join(this.installRoot, 'packages');

  if (path.existsSync(this.installRoot))
    wrench.rmdirSyncRecursive(this.installRoot);

  wrench.mkdirSyncRecursive(this.installRoot);

  var reader = fstream.Reader(this.path);
  var writer = fstream.Writer(this.installRoot);

  writer.on('close', fn)
  reader.pipe(writer);
};

Meteor.prototype.addPackage = function(package, fn) {
  var packagePath = path.join(this.packagesRoot, package.name);
  if (path.existsSync(packagePath))
    wrench.rmdirSyncRecursive(packagePath);
  fs.symlink(package.libPath, packagePath, fn);
};

Meteor.prototype._prepare = function(config) {

  var head = config.branch || config.ref || config.tag || 'master';
  var url = config.git || 'https://github.com/meteor/meteor.git';

  this.config = config;

  this.repo = {
    checkout: 'branch',
    head: head,
    url: url
  };
};

module.exports = Meteor;