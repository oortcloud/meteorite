var path = require('path');
var _ = require('underscore');
_.str = require('underscore.string');
var Repo = require('./repo');
var fs = require('fs');
var fstream = require('fstream');
var wrench = require('wrench');

Meteor = function(config) {
  this._prepare(config);
  this.installRoot = path.join(process.cwd(), '.meteor', 'meteorite', 'meteor');
  this.packagesRoot = path.join(this.installRoot, 'packages');
  this.repo.path = path.join(Meteorite.root(), 'meteors', this.repo.checkout, this.repo.head);
};

Meteor.prototype.installApp = function(fn) {
  var self = this;
  
  if (!path.existsSync(this.installRoot)) {

    wrench.mkdirSyncRecursive(this.installRoot);
    var reader = fstream.Reader(this.repo.path);
    var writer = fstream.Writer(this.installRoot);

    writer.on('close', fn)
    reader.pipe(writer);
  } else {
    fn();
  }
};

Meteor.prototype.addPackage = function(package) {
  var packagePath = path.join(this.packagesRoot, package.name);

  if (!path.existsSync(packagePath))
    fs.symlinkSync(package.libPath(), packagePath);
};

Meteor.prototype._prepare = function(config) {
  config.git || (config.git = 'https://github.com/meteor/meteor.git');
  this.repo = new Repo(config);
};

module.exports = Meteor;
