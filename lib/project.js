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
  
  this.meteorRoot = path.join(process.cwd(), '.meteor');
  this.installRoot = path.join(this.meteorRoot, 'meteorite');
  this.packagesRoot = path.join(this.installRoot, 'packages');
  
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

Project.prototype.uninstall = function() {
  wrench.rmdirSyncRecursive(this.installRoot);
}

Project.prototype.install = function(fn) {
  var self = this;
  
  // Only install if there's not already something there. 
  // TODO: check if versions have changed etc
  if (!path.existsSync(this.packagesRoot)) {
    self._prepareFS();
    
    self.fetch(function() {
      self.meteor.install(self, function() {
        self.packages.install(self);
        fn.call(self);
      });
    });
  }
};

Project.prototype._prepareFS = function() {
  var self = this;

  // create the directory and add it to the .gitignore
  wrench.mkdirSyncRecursive(self.installRoot);
  
  // TODO -- check if it's in there already
  var gitignore = path.join(self.meteorRoot, '.gitignore');
  var stream = fs.createWriteStream(gitignore, {flags: 'a'});
  stream.write("meteorite\n")
  stream.end();
};

Project.prototype.addPackage = function(package) {
  var packagePath = path.join(this.packagesRoot, package.name);
  fs.unlink(packagePath);
  fs.symlinkSync(package.libPath(), packagePath);
};


module.exports = Project;

