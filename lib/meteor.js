var path = require('path');
var _ = require('underscore');
var GitSource = require('./sources/git');
var LocalSource = require('./sources/local');
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

  // Init source
  if (config.path)
    this.source = new LocalSource(Meteor.installRoot(), config);
  else
    this.source = new GitSource(Meteor.installRoot(), config);

  // TODO -- this is a bit coarse. but it avoids multiple installs for now
  this.prepared = path.existsSync(this.source.path);
};

// download the repo + install dev_bundle
Meteor.prototype.prepare = function(fn) {
  if (this.source.isLoaded())
    self.install(fn);
  else
    this.fetch(fn);
};

Meteor.prototype.fetch = function(fn) {
  var self = this;

  console.log('Fetching Meteor ' + self.source + '...');

  self.source.fetch(function() {
    self.install(fn);
  });
};

Meteor.prototype.install = function(fn) {
  var self = this;

  self.prepared = true;

  // ensure the dev_bundle is installed.
  var dev_bundle = path.join(self.source.path, 'dev_bundle');

  if (!path.existsSync(dev_bundle)) {
    // a little hack. meteor --help installs the dev bundle before doing anything else
    console.log('Downloading Meteor development bundle...');
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
Meteor.prototype.execute = function(args, fn) {
  var self = this;
  
  self.ensurePrepared(function() {
    Command.execute(path.join(self.source.path, 'meteor'), args, fn);
  });
};

// install a downloaded meteor into a project
Meteor.prototype.installInto = function(project, fn) {

  if (!path.existsSync(path.join(project.installRoot, 'meteor'))) {
    
    console.log('Install custom meteor build...');
    
    // Copy meteor from ~/.meteorite/meteors to ./.meteor/meteorite
    var reader = fstream.Reader(this.source.path);
    var writer = fstream.Writer(project.installRoot);
  
    // Cleanup
    writer.on('close', fn);
  
    // Do it already
    reader.pipe(writer);

  } else {
    fn();
  }
};

Meteor.prototype.smartJson = function() {
  return this.source.smartJson();
};

Meteor.installRoot = function() {
  return path.join(Meteorite.root(), 'meteors');
};

module.exports = Meteor;
