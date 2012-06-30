var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var Packages = require('./packages');
var Config = require('./config');
var Meteor = require('./meteor');
var Meteorite = require('./meteorite');
var wrench = require('wrench');

// The project is the current directory's personal version of meteor,
// complete with it's own set of packages.
// it installs into ./meteor/meteorite

Project = function() {
  
  // Make directories we'll need
  Meteorite.prepareFS();
  
  // Figure out all the paths we'll need to know
  this.meteorRoot = path.join(process.cwd(), '.meteor');
  this.installRoot = path.join(this.meteorRoot, 'meteorite');
  this.packagesRoot = path.join(this.installRoot, 'packages');
  
  // Build up all the objects we'll need
  this.config = new Config(process.cwd());
  this.packages = new Packages(this.config.packages);
  this.meteor = new Meteor(this.config.meteor);

};

Project.prototype.fetch = function(fn) {
  var self = this;

  // Fetch the packages
  self.packages.fetch(function() {
    
    // Fetch meteor
    self.meteor.repo.fetch(fn);
  });

};

Project.prototype.uninstall = function() {
  
  // Kill ./.meteor/meteorite
  wrench.rmdirSyncRecursive(this.installRoot);

};

Project.prototype.install = function(fn) {
  var self = this;
  
  // Only install if there's not already something there. 
  // TODO: check if versions have changed etc
  if (!path.existsSync(this.packagesRoot)) {

    // Prepare dirs
    self._prepareFS();
    
    // Fetch everything the project needs
    self.fetch(function() {
      
      // Install meteor in ./.meteor/meteorite
      self.meteor.install(self, function() {
        
        // Add each package to newly installed meteor
        self.packages.install(self);
        
        // Get on with life
        fn();
      });
    });
  }

};

Project.prototype._prepareFS = function() {

  // create the directory and add it to the .gitignore
  wrench.mkdirSyncRecursive(this.installRoot);

  // Add ./.meteor/meteorite to ./.meteor/.gitignore
  var gitignore = path.join(this.meteorRoot, '.gitignore');
  var stream = fs.createWriteStream(gitignore, {flags: 'a'});
  stream.write("meteorite\n")
  stream.end();

};

Project.prototype.addPackage = function(package) {

  // Figure out where it should go
  var packagePath = path.join(this.packagesRoot, package.name);

  // Destroy old link
  fs.unlink(packagePath);
  
  // Make new link
  fs.symlinkSync(package.libPath(), packagePath);

};

module.exports = Project;
