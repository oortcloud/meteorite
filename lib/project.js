var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var Dependencies = require('./dependencies/dependencies');
var Config = require('./config');
var Meteor = require('./meteor');
var Command = require('./command');
var wrench = require('wrench');
var exec = require('child_process').exec;

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
  
  // set a base meteor if it's specified in the args (or a default one if not)
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
  
  var newMeteor = new Meteor(config.meteor);
  var newDeps =  new Dependencies(this.root, config.packages);
  
  if (force || !this.meteor.equals(newMeteor) || !this.dependencies || !this.dependencies.equalBase(newDeps)) {
    
    if (!force && this.dependencies)
      console.log('smart.json changed.. installing from smart.json...');
      
    this.lockChanged = true;
    this.meteor = newMeteor;
    this.dependencies = newDeps;
  }
};

Project.prototype.fetch = function(fn, force) {
  var self = this;
  
  // prepare dependencies and meteor
  self.initFromLock();
  self.checkSmartJson(force);
  
  // Ensure the right version of meteor has been fetched
  self.meteor.prepare(function() {
    
    // resolving dependencies fetches them. We need to check otherwise
    if (!self.dependencies.resolved()) {
      
      console.log('Resolving dependencies..');
      self.dependencies.resolve(fn);
    } else {
      
      self.dependencies.fetch(fn);
    }
  });
};

Project.prototype.uninstall = function() {
  var self = this;
  
  // Kill ./.meteor/meteorite
  console.log('Uninstalling custom meteor build...');
  self.meteor.uninstallFrom(self);
};

// either install from smart.lock or prepare smart.lock and do so
Project.prototype.install = function(fn, force) {
  var self = this;
  
  // Fetch everything the project needs
  self.fetch(function() {
    // install the smart.lock file
    if (fs.existsSync(self.smartJsonPath) && (self.lockChanged || !fs.existsSync(self.smartLockPath)))
      self.writeLockFile();
    
    if (!self.needsToInstall())
      return fn();
    
    // Add meteorite to gitignore
    self._addToGitIgnore();
    
    // Install meteor there
    self.meteor.installInto(self, function() {
      
      // Add each package to newly installed meteor
      self.dependencies.installInto(self, function() {
        console.log('Meteor installed');
        fn();
      });
    });
  }, force);
};

// if there's no dependencies we don't have to install
Project.prototype.needsToInstall = function() {
  return !this.dependencies.isEmpty();
}

Project.prototype.isMeteorInstalled = function(fn) {
  
  var meteorPath = path.join(this.installRoot, 'meteor');
  if (!fs.existsSync(meteorPath))
    fn(false);
  else
    this.meteor.source.installedInto(this.installRoot, fn);
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
    if (self.needsToInstall()) {
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

// ensure a named package is installed
//
// NOTE: Right now, if the package is already available (included in meteor, already in smart.json)
// we ignore the version, and just stick with what we have
//
// TODO: In the future a version # would override anything in meteor + rewrite smart.json
// but right now it's TBH to overwrite meteor's packages.
Project.prototype.installPackage = function(pkgName, version, fn) {
  var self = this;
  
  // first ensure we are fetched, so we know _all_ the packages that are available
  self.fetch(function() {
    
    // now, check if we have the package already
    if (self.hasPackage(pkgName))
      return fn();
    
    // better check that the package exists on atmosphere
    Atmosphere.package(pkgName, function(atmosphere_defn) {
      
      if (!atmosphere_defn)
        throw "Package named " + pkgName + " doesn't exist in your meteor installation, smart.json, or on atmosphere";
      
      // ok, it's not installed. So we need to add it (permanently) to the smart.json
      // and clear our dependencies
      var smartJson = self.readSmartJson();
      var defn = {}
      if (version)
        defn.version = version;
      smartJson.packages = smartJson.packages || {};
      smartJson.packages[pkgName] = defn;
      self.writeSmartJson(smartJson);
      
      // maybe a hack to read it back out from disk, but not a big deal I don't think
      self.checkSmartJson(true);
      
      fn();
    });
  });
}

// Is the package part of the meteor install, or is it a dependency?
//
// NOTE: assumes we have fetched. FIXME: figure out a better / systematic way
// to write code that has this sort of assumption
Project.prototype.hasPackage = function(pkgName) {
  
  return this.meteor.hasPackage(pkgName) || this.dependencies.packages[pkgName];
};

// very simple version of what config does
Project.prototype.readSmartJson = function() {
  
  try {
    var rawConfig = fs.readFileSync(path.join(this.root, 'smart.json')).toString();
    return JSON.parse(rawConfig);
    
  } catch (err) {
    return {};
  }
};

Project.prototype.smartJson = function() {
  var data = {};
  
  if (!this.meteor.defaultMeteor)
    data.meteor = this.meteor.toJson();
  
  if (this.dependencies)
    data.packages = this.dependencies.toJson().basePackages;
  else
    data.packages = {};
  
  return data;
};


Project.prototype.writeSmartJson = function(json) {
  json = json || this.smartJson();
  
  // Make a nicely formated default json string
  var smartJsonString = JSON.stringify(json, null, 2) + "\n";
  
  // Write to disk
  if (fs.existsSync(this.root))
    fs.writeFileSync(this.smartJsonPath, smartJsonString);
};

Project.prototype.lockJson = function() {
  
  return {
    meteor: this.meteor.toJson(true),
    dependencies: this.dependencies.toJson(true)
  };
};

// write out into smart.lock
Project.prototype.writeLockFile = function() {
  
  var smartJsonString = JSON.stringify(this.lockJson(), null, 2) + "\n";
  fs.writeFileSync(this.smartLockPath, smartJsonString);
};


module.exports = Project;
