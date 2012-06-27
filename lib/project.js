var path = require('path');
var fstream = require('fstream');
var fs = require('fs');
var _ = require('underscore');
_.str = require('underscore.string');
var spawn = require('child_process').spawn;
var Packages = require('./packages');
var Config = require('./config');
var Meteor = require('./meteor');
var wrench = require('wrench');

_.mixin(_.str.exports());

Project = function() {
  this._prepareFS();

  var config = new Config(process.cwd());
  this.packages = new Packages(config.packages);
  this.meteor = new Meteor(config.meteor);
};

Project.prototype.fetch = function(fn) {
  var self = this;
  self.packages.fetch(function() {
    self.meteor.fetch(function() {
      self.meteor.update(function() {
        fn(self);
      });
    });
  });
};

Project.prototype.run = function(fn) {
  this.fetch(fn);
};

Project.prototype._fetchDeps = function() {
  
};

Project.prototype._installMeteor = function() {

};

Project.prototype._installDeps = function() {

};

Project.prototype._prepareFS = function() {
  var mrtDir = Meteor._meteoriteDir();
  if (!path.existsSync(mrtDir))
    fs.mkdir(mrtDir);
};

module.exports = Project;
