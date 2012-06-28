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

Meteor.prototype.run = function() {
  console.log('Running app');
  var self = this;
  var meteor = spawn(path.join(self.installRoot, 'meteor'), ['run', '--port=6765']);

  // TODO figure out how to stream output from meteor app
  // meteor.stdin.on('data', function (data) {
  //   console.log(data.toString());
  // });
  
  // meteor.stderr.on('data', function (data) {
  //   console.log(data.toString());
  // });

  meteor.on('exit', function (code) {
    if (code !== 0)
      console.log('Error: meteor exited!');
    else
      console.log('Meteor is done!');
  });
  
};

Meteor.prototype.installApp = function(appRoot, fn) {
  console.log('Installing app');
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

Meteor.prototype.addPackage = function(package) {
  var packagePath = path.join(this.packagesRoot, package.name);

  if (!path.existsSync(packagePath))
    fs.symlinkSync(package.libPath, packagePath);
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