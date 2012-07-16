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
  this.smartLockPath = path.join(this.root, 'smart.lock');
  this.meteorRoot = path.join(this.root, '.meteor');
  this.installRoot = path.join(this.meteorRoot, 'meteorite');
  this.packagesRoot = path.join(this.installRoot, 'packages');
  
  // meteor + deps start off empty (or from meteorArgs if creating) 
  if (meteorArgs.path) // ensure the path is absolute
    meteorArgs.path = path.resolve(this.root, meteorArgs.path);
  this.meteor = new Meteor(meteorArgs);
  
};

// read the config from smart.lock if it exists
Project.prototype.initFromLock = function() {
  
  if (fs.existsSync(this.smartLockPath)) {
    var data = fs.readFileSync(this.smartLockPath).toString();
    var lockData = JSON.parse(data);
    
    this.meteor = new Meteor(lockData.meteor);
    this.dependencies = Dependencies.newFromLockJson(this, lockData.dependencies);
  }
};

// have a look in smart.json, see if it's different to what we have from smart.lock
Project.prototype.checkSmartJson = function(force) {
  
  // this is the config specified in smart.json
  var config = new Config(this.root);
  
  // TODO -- config should just do this for me
  if (config.meteor && config.meteor.path) 
    config.meteor.path = path.resolve(this.root, config.meteor.path);
  
  // if config.meteor is empty we don't need to override this.meteor
  var newMeteor = this.meteor;
  if (config.meteor)
    newMeteor = new Meteor(config.meteor);
  var newDeps =  new Dependencies(this.root, config.packages);
  
  if (force || !this.meteor.equals(newMeteor) || !this.dependencies || !this.dependencies.equalBase(newDeps)) {
    
    if (!force && this.dependencies)
      console.log('smart.json changed.. installing from smart.json...');
      
    this.lockChanged = true;
    this.meteor = newMeteor;
    this.dependencies = newDeps;
  }
};

Project.prototype.fetch = function(fn) {
  var self = this;
  
  // Ensure the right version of meteor has been fetched
  self.meteor.prepare(function() {
    
    // resolving dependencies fetches them.
    // FIXME -- if we don't resolve, this assumes that they are still there. Should we double check?
    if (!self.dependencies.resolved()) {
      console.log('Resolving dependencies..');
      self.dependencies.resolve(fn);
    } else {
      fn();
    }
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
Project.prototype.install = function(fn, force) {
  var self = this;
  
  // prepare dependencies and meteor
  self.initFromLock();
  self.checkSmartJson(force);
  
  // if there's no dependencies we don't have to install
  if (!self.dependencies.isEmpty()) {
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
      if (self.lockChanged || !fs.existsSync(self.smartLockPath))
        self.writeLockFile();

      // Install meteor in ./.meteor/meteorite
      self.meteor.installInto(self, function() {

        // Add each package to newly installed meteor
        self.dependencies.installInto(self, function() {
          console.log('Installed');
          fn();
        });
      });
    });
  } else {
    // just need to make sure we have the right version of meteor fetched
    self.fetch(fn);
  }
};

Project.prototype.isMeteorInstalled = function() {
  return fs.existsSync(path.join(this.installRoot, 'meteor'));
};

// prepare a new smart.lock, then install
Project.prototype.update = function(fn) {
  
  this.install(fn, true);
};

Project.prototype.execute = function(args, fn) {
  var self = this;
  
  // TODO -- what do we do here if not installed? I'm not sure we just go ahead
  //   and install, we should probably abort and tell them
  self.install(function() {
    if (!self.dependencies.isEmpty()) {
      Command.execute(path.join(self.installRoot, 'meteor'), args, fn);
    } else {
      self.meteor.execute(args, fn);
    }
  });
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
    data.meteor = this.meteor.toJson();
  
  return data;
};


Project.prototype.writeSmartJson = function() {
  // Make a nicely formated default json string
  var smartJsonString = JSON.stringify(this.smartJson(), null, 2) + "\n";
  
  // Write to disk
  if (fs.existsSync(this.root))
    fs.writeFileSync(this.smartJsonPath, smartJsonString);
};

Project.prototype.lockJson = function() {
  
  return {
    meteor: this.meteor.toJson(true),
    dependencies: this.dependencies.lockJson()
  };
};

// write out into smart.lock
Project.prototype.writeLockFile = function() {
  
  var smartJsonString = JSON.stringify(this.lockJson(), null, 2) + "\n";
  fs.writeFileSync(this.smartLockPath, smartJsonString);
};


module.exports = Project;
