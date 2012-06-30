var path = require('path');
var _ = require('underscore');
_.str = require('underscore.string');
var Repo = require('./repo');
var fs = require('fs');
var fstream = require('fstream');
var wrench = require('wrench');

// A 'Meteor' refers to a single commit (branch, tag) of a version of the core meteor
//
// They are located on disk in ~/.meteorite/meteors.
// When you install a meteor into a project, it copies everything apart from
// dev_bundle into .meteor/meteorite to create a 'custom' version of meteor
// for you to install packages into.
Meteor = function(config) {
  this._prepare(config);
  this.repo.path = path.join(Meteorite.root(), 'meteors', this.repo.checkout, this.repo.head);
};

Meteor.prototype.install = function(project, fn) {
  var self = this;
  
  var reader = fstream.Reader(this.repo.path);
  var writer = fstream.Writer(project.installRoot);
  
  writer.on('close', fn)
  reader.pipe(writer);
};

Meteor.prototype._prepare = function(config) {
  config.git || (config.git = 'https://github.com/meteor/meteor.git');
  this.repo = new Repo(config);
};

module.exports = Meteor;
