var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var Packages = require('./packages');
var Config = require('./config');
var Meteor = require('./meteor');
var Command = require('./command');
var wrench = require('wrench');
var spawn = require('child_process').spawn;

// The project is the current directory's personal version of meteor,
// complete with it's own set of packages.
// it installs into ./meteor/meteorite

Project = function() {
  
  // Figure out all the paths we'll need to know
  this.meteorRoot = path.join(process.cwd(), '.meteor');
  this.installRoot = path.join(this.meteorRoot, 'meteorite');
  this.packagesRoot = path.join(this.installRoot, 'packages');
  
  // Build up all the objects we'll need
  this.config = new Config(process.cwd());
  this.packages = new Packages(this);
  this.meteor = new Meteor(this.config.meteor);
  
  // TODO -- this is a bit coarse. but it avoids multiple installs for now
  this.installed = path.existsSync(this.installRoot);
};

Project.prototype.fetch = function(fn) {
  var self = this;

  // Fetch the packages
  self.packages.fetch(function() {
    
    // Fetch meteor
    self.meteor.prepare(fn);
  });

};

Project.prototype.uninstall = function() {
  var self = this;
  
  // Kill ./.meteor/meteorite
  if (path.existsSync(self.installRoot)) {
    console.log('Uninstalling custom meteor build...');
    wrench.rmdirSyncRecursive(self.installRoot);
  }
};

Project.prototype.install = function(fn) {
  var self = this;
  
  // Create the directory
  wrench.mkdirSyncRecursive(this.installRoot);
  
  // Add meteorite to gitignore
  self._addToGitIgnore();

  // Fetch everything the project needs
  self.fetch(function() {
    
    // Install meteor in ./.meteor/meteorite
    self.meteor.installInto(self, function() {
      
      // Add each package to newly installed meteor
      self.packages.installInto(self, function() {
        
        // mark ourself installed
        self.installed = true;
        fn();
      });
    });
  });
};

Project.prototype.ensureInstalled = function(fn) {
  if (this.installed) {
    fn();
  } else {
    this.install(fn);
  }
};

Project.prototype.execute = function(args, fn) {
  var self = this;
  
  if (self.config.custom) {
    self.ensureInstalled(function() {
      Command.execute(path.join(self.installRoot, 'meteor'), args, fn);
    });
    
  } else {
    self.meteor.execute(args, fn);
  }
};

Project.prototype._addToGitIgnore = function() {

  if (!path.existsSync(gitignorePath))
    return;
  
  var gitignorePath = path.join(this.meteorRoot, '.gitignore');
  var gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  // Add ./.meteor/meteorite to ./.meteor/.gitignore
  // but only if it's not aleady in there
  if (!/meteorite/.test(gitignoreContent)) {
    console.log('Adding meteorite to .meteor/gitignore ...');
    fs.writeFileSync(gitignorePath, gitignoreContent + "meteorite\n");
  }

};

Project.prototype.hasPackage = function(pkg) {
  // Figure out where it is
  // TODO move this to package
  var packagePath = path.join(this.packagesRoot, pkg.name);

  return path.existsSync(packagePath);
};

module.exports = Project;
