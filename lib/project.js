var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var Packages = require('./packages');
var Config = require('./config');
var Meteor = require('./meteor');
var Command = require('./command');
var wrench = require('wrench');

// The project is the current directory's personal version of meteor,
// complete with it's own set of packages.
// it installs into ./meteor/meteorite

Project = function(root, meteorArgs) {
  
  // Figure out all the paths we'll need to know
  this.root = root;
  this.smartJsonPath = path.join(this.root, 'smart.json');
  this.meteorRoot = path.join(this.root, '.meteor');
  this.installRoot = path.join(this.meteorRoot, 'meteorite');
  this.packagesRoot = path.join(this.installRoot, 'packages');
  
  // Build up all the objects we'll need
  this.config = new Config(this.root);
  this.packages = new Packages(this);
  this.meteor = new Meteor(this.config.meteor || meteorArgs);
  
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

Project.prototype.execute = function(args, fn) {
  var self = this;
  
  if (self.config.custom)
    self.install(function() {
      Command.execute(path.join(self.installRoot, 'meteor'), args, fn);
    });
    
  else
    self.meteor.execute(args, fn);

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

Project.prototype.smartJson = function() {
  // TODO Package.ssmartJson
  var data = {packages: {}};
  
  if (!this.meteor.defaultMeteor)
    data.meteor = this.meteor.smartJson();
  
  return data;
};


Project.prototype.writeSmartJson = function(fn) {
  // Make a nicely formated default json string
  var smartJsonString = JSON.stringify(this.smartJson(), null, 2) + "\n";
  
  // Write to disk
  fs.writeFile(this.smartJsonPath, smartJsonString, function(err) {
    // TODO do something
    // if (err)
    //   console.log("Error: could not create smart.json", err);
    fn();
  });
};



module.exports = Project;
