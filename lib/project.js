var path = require('path');
var fs = require('fs');
var _ = require('underscore');
_.str = require('underscore.string');
var Packages = require('./packages');
var Config = require('./config');
var Meteor = require('./meteor');
var Meteorite = require('./meteorite');
var wrench = require('wrench');

_.mixin(_.str.exports());

// The project is the current directory's personal version of meteor,
// complete with it's own set of packages.
// it installs into ./meteor/meteorite

Project = function() {
  Meteorite.prepareFS();
  this._prepareFS();
  
  this.config = new Config(process.cwd());
  this.packages = new Packages(this.config.packages);
  this.meteor = new Meteor(this.config.meteor);
};

Project.prototype.fetch = function(fn) {
  var self = this;
  self.packages.fetch(function() {
    self.meteor.repo.fetch(fn);
  });
};

Project.prototype.install = function(fn) {
  var self = this;
  self.fetch(function() {
    self.meteor.install(self, function() {
      self.packages.install(self);
      fn.call(self);
    });
  });
};

Project.prototype.addPackage = function(package) {
  var packagePath = path.join(this.packagesRoot, package.name);
  fs.unlink(packagePath);
  fs.symlinkSync(package.libPath(), packagePath);
};

Project.prototype._prepareFS = function() {
  var meteorRoot = path.join(process.cwd(), '.meteor');
  this.installRoot = path.join(meteorRoot, 'meteorite');
  this.packagesRoot = path.join(this.installRoot, 'packages');
  
  if (!path.existsSync(this.installRoot)) {
    // create the directory and add it to the .gitignore
    wrench.mkdirSyncRecursive(this.installRoot);
    
    var gitignore = path.join(meteorRoot, '.gitignore');
    var stream = fs.createWriteStream(gitignore, {flags: 'a'});
    stream.write("meteorite\n")
    stream.end();
  }
};

module.exports = Project;

