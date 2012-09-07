var path = require('path');
var _ = require('underscore');
var Source = require('./sources/source');
var Command = require('./command');
var fs = require('fs');
var fstream = require('fstream');
var wrench = require('wrench');
var spawn = require('child_process').spawn;

// A 'Meteor' refers to a single commit (branch, tag) of a version of the core meteor
//
// They are located on disk in ~/.meteorite/meteors.
// When you install a meteor into a project, it copies everything into
// ./.meteor/meteorite to create a 'custom' version of meteor for you to install packages into.
Meteor = function(config) {

  // Config defaults
  config = config || {};
  if (config === {})
    this.defaultMeteor = true;
  
  config.git = config.git || 'https://github.com/meteor/meteor.git';
  config.keepGitDir = true;

  // Prepare source
  var root = Meteor.installRoot();
  this.source = Source.prepare(root, config);

  // TODO -- this is a bit coarse. but it avoids multiple installs for now
  this.prepared = fs.existsSync(this.source.path);
};

// download the repo + install dev_bundle
Meteor.prototype.prepare = function(fn) {
  var self = this;
  
  self.source.fetch(function() {
    self.install(fn);
  }, 'Meteor');
};

Meteor.prototype.install = function(fn) {
  var self = this;

  self.prepared = true;

  // ensure the dev_bundle is installed.
  var dev_bundle = path.join(self.source.path, 'dev_bundle');

  if (!fs.existsSync(dev_bundle)) {
    // a little hack. meteor --help installs the dev bundle before doing anything else
    console.log('Downloading Meteor development bundle');
    var meteor = spawn('./meteor', ['--help'], {cwd: self.source.path});

    // just output the status bar
    meteor.stderr.pipe(process.stderr);
    meteor.on('exit', fn);
  } else {
    fn();
  }
};

// check that the above has happened
Meteor.prototype.ensurePrepared = function(fn) {
  if (this.prepared) {
    fn();
  } else {
    this.prepare(fn);
  }
};

// run a command using just this checked-out version of meteor
Meteor.prototype.execute = function(args, package_dir, fn) {
  var self = this;
  
  if (_.isFunction(package_dir)) {
    fn = package_dir;
    package_dir = null;
  }
  
  self.ensurePrepared(function() {
    Command.execute(path.join(self.source.packagePath(), 'meteor'), args, package_dir, fn);
  });
};

// NOTE: assumes that meteor has been fetched
Meteor.prototype.hasPackage = function(pkgName) {
  return fs.existsSync(path.join(this.source.path, 'packages', pkgName))
}

Meteor.prototype.toJson = function(lock) {
  return this.source.toJson(lock);
};

Meteor.prototype.equals = function(otherMeteor) {
  
  return this.source.equals(otherMeteor.source);
};

Meteor.installRoot = function() {
  return path.join(Meteorite.root(), 'meteors');
};

module.exports = Meteor;
