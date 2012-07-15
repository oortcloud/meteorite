var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var Dependencies = require('./dependencies/dependencies');
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
  
  // this is the config specified in smart.json
  this.config = new Config(this.root);
  
  // read the config from smart.lock if it exists
  if (fs.existsSync(this.lockFilename)) {
    this.dependencies = Dependencies.newFromLockFile(this);
  } 
  
  // ensure the path is absolute
  meteorArgs = this.config.meteor || meteorArgs;
  if (meteorArgs.path)
    meteorArgs.path = path.resolve(this.root, meteorArgs.path);
  this.meteor = new Meteor(meteorArgs);
};


Project.prototype.fetch = function(fn) {
  var self = this;
  
  // Ensure the right version of meteor has been fetched
  self.meteor.prepare(function() {
    // If we don't have saved deps or they aren't the same as what's in smart.json,
    // we have to re-calc from smart.json
    var baseDeps = new Dependencies(self.root, self.config.packages);
    self.dependencies = self.dependencies || baseDeps;
      
    if (!self.dependencies.equalBase(baseDeps)) {
      console.log('smart.json has changed, recalcuating dependencies');
      self.lockChanged = true;
      self.dependencies = baseDeps;
    }
    
    // resolving dependencies fetches them.
    // FIXME -- if we don't resolve, this assumes that they are still there. Should we double check?
    if (!self.dependencies.resolved())
      self.dependencies.resolve(fn)
    else
      fn()
  });
};

Project.prototype.uninstall = function() {
  var self = this;
  
  // Kill ./.meteor/meteorite
  if (fs.existsSync(self.installRoot)) {
    console.log('Uninstalling custom meteor build...');
    wrench.rmdirSyncRecursive(self.installRoot);
  }
};

// either install from smart.lock or prepare smart.lock and do so
Project.prototype.install = function(fn) {
  var self = this;
  
  // make a place for us to install into
  if (!fs.existsSync(this.installRoot)) {
    
    // Create the directory
    wrench.mkdirSyncRecursive(this.installRoot);
    
    // Add meteorite to gitignore
    self._addToGitIgnore();
  }
  
  // Fetch everything the project needs
  self.fetch(function() {
    
    // install the smart.lock file
    if (self.lockChanged || !fs.existsSync(self.lockFilename()))
      self.dependencies.writeLockFile(self);
    
    // Install meteor in ./.meteor/meteorite
    self.meteor.installInto(self, function() {
      
      // Add each package to newly installed meteor
      self.dependencies.installInto(self, function() {
        
        // mark ourself installed
        self.installed = true;
        fn();
      });
    });
  });
};

// prepare a new smart.lock, then install
Project.prototype.update = function(fn) {
  
  this.lockChanged = true;
  this.dependencies = new Dependencies(self.root, self.config.packages);
  this.install(fn);
}

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

  if (!fs.existsSync(gitignorePath))
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
  var packagePath = path.join(this.packagesRoot, pkg.name);

  return fs.existsSync(packagePath);
};

Project.prototype.smartJson = function() {
  // TODO Package.smartJson
  var data = {packages: {}};
  
  if (!this.meteor.defaultMeteor)
    data.meteor = this.meteor.smartJson();
  
  return data;
};


Project.prototype.writeSmartJson = function() {
  // Make a nicely formated default json string
  var smartJsonString = JSON.stringify(this.smartJson(), null, 2) + "\n";
  
  // Write to disk
  if (fs.existsSync(this.root))
    fs.writeFileSync(this.smartJsonPath, smartJsonString);
};

Project.prototype.lockFilename = function() {
  return path.join(this.root, 'smart.lock');
};

module.exports = Project;
