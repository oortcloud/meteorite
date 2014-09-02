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
// complete with its own set of packages.
// it installs into ./meteor/meteorite

Project = function(root, meteorArgs) {
  
  // Figure out all the paths we'll need to know
  this.root = root;
  this.meteorArgs = meteorArgs;
  this.smartJsonPath = path.join(this.root, 'smart.json');
  this.smartLockPath = path.join(this.root, 'smart.lock');
  this.packagesRoot = path.join(this.root, 'packages');
  
  // set a base meteor if it's specified in the args (or a default one if not)
  this.meteor = new Meteor(meteorArgs);
};

// read the config from smart.lock if it exists
Project.prototype.initFromLock = function() {
  var self = this;
  
  if (fs.existsSync(this.smartLockPath)) {
    var data = fs.readFileSync(this.smartLockPath).toString();
    var lockData = JSON.parse(data);
    
    // embed the root path in all this data
    lockData.meteor.root = self.root;
    _.each(lockData.dependencies.basePackages, function(pkg) {
      pkg.root = self.root;
    });
    _.each(lockData.dependencies.packages, function(pkg) {
      pkg.root = self.root;
    });
    
    this.meteor = new Meteor(lockData.meteor);
    this.dependencies = Dependencies.newFromLockJson(lockData.dependencies);
  }
};

// have a look in smart.json, see if it's different to what we have from smart.lock
Project.prototype.checkSmartJson = function(forceUpdate) {
  
  // this is the config specified in smart.json
  var config = new Config(this.root);
  
  var newMeteor = new Meteor(config.meteor);
  // when running in the context of a package, we are the only required package
  if (config.name) {
    var specifier = {};
    specifier[config.name] = {path: "."};
    var newDeps = new Dependencies(specifier);
  } else {
    var newDeps = new Dependencies(config.packages);
  }
  
  if (forceUpdate || !this.meteor.equals(newMeteor) || !this.dependencies || !this.dependencies.equalBase(newDeps)) {
    
    if (!forceUpdate && this.dependencies)
      console.log('smart.json changed.. installing from smart.json');
      
    this.lockChanged = true;
    this.meteor = newMeteor;
    this.dependencies = newDeps;
  }
};

// FIXME - this doesn't actually fetch the packages.
// we only fetch them when we are about to install them, or we need to 
// take a look inside them. I think this is reasonable.
Project.prototype.fetch = function(fn, forceUpdate) {
  var self = this;
  
  // prepare dependencies and meteor
  self.initFromLock();
  self.checkSmartJson(forceUpdate);
  
  // Ensure the right version of meteor has been fetched
  var buildDevBundle = !! self.meteorArgs['build-dev-bundle'];
  self.meteor.prepare(buildDevBundle, function() {
    
    // resolving dependencies fetches them. We need to check otherwise
    if (!self.dependencies.resolved()) {

      console.verbose('Resolving dependency tree');

      self.dependencies.resolve(self.meteorArgs.force, function(err, conflicts) {
        
        _.each(conflicts, function(conflict, name) {
          console.log(('Problem installing ' + name.bold).red);
          console.log(("  ✘ " + conflict).red);
        });
        
        if (err) {
          console.log(err.message.red);
          process.exit(1);
        }
          
        fn();
      });
    } else {
      fn();
    }
  });
};

Project.prototype.uninstall = function() {
  var self = this;
  
  // for now, remove anything in packages/ that is a symlink  
  if (fs.existsSync(this.packagesRoot)) {
    var dirs = fs.readdirSync(this.packagesRoot);
    
    _.each(dirs, function(dir) {
      var dirPath = path.join(self.packagesRoot, dir);
      
      if (fs.lstatSync(dirPath).isSymbolicLink())
        fs.unlink(dirPath)
    });
  }
};

// either install from smart.lock or prepare smart.lock and do so
Project.prototype.install = function(fn, forceUpdate) {
  var self = this;
  
  self._optimizeFS();
  
  // Fetch everything the project needs
  self.fetch(function() {
    
    // ensure that the installRoot exists
    if (! self.dependencies.isEmpty())
      wrench.mkdirSyncRecursive(self.packagesRoot);
      
    // Link each package into installRoot
    self.dependencies.installInto(self, function(packagesInstalled) {
      console.log();
      console.log('Done installing smart packages'.bold);
      
      // install the smart.lock file
      if (fs.existsSync(self.smartJsonPath) && (self.lockChanged || !fs.existsSync(self.smartLockPath)))
        self.writeLockFile();
      
      fn();
    });
  }, forceUpdate);
};

// if there's no dependencies we don't have to install
Project.prototype.needsToInstall = function() {
  return !this.dependencies.isEmpty();
}

// prepare a new smart.lock, then install
Project.prototype.update = function(fn) {
  
  this.install(fn, true);
};

Project.prototype.execute = function(args, fn) {
  var self = this;

  if (self.meteorArgs.version) 
    console.suppress();

  console.log();
  console.log("Stand back while Meteorite does its thing".bold);
  
  // TODO -- what do we do here if not installed? I'm not sure we just go ahead
  //   and install, we should probably abort and tell them
  self.install(function() {

    console.log();
    console.log("Ok, everything's ready. Here comes Meteor!".green);
    console.log();

    if (self.meteorArgs.version) 
      console.unsuppress();
    
    self.meteor.execute(args, self.packagesRoot, fn);
  });
};

// assumes that we are installed.
Project.prototype.isUsing = function(packageName, fn) {
  var self = this;
  
  self.install(function() {
    return self.meteor.isUsing(packageName, fn);
  });
}

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
    
    self.hasPackage(pkgName, function(check) {
      // if we have the package already
      if (check)
        return fn();
        
      // better check that the package exists on atmosphere
      Atmosphere.package(pkgName, function(atmosphere_defn) {
    
        if (!atmosphere_defn)
          throw("Package named " + pkgName + " doesn't exist in your meteor installation, smart.json, or on atmosphere");
    
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
  });
}

// remove a package that is listed in smart.json (if it is indeed listed there)
Project.prototype.uninstallPackage = function(pkgName, fn) {
  var self = this;
  
  // we need to be fetched so we have all the information
  // self.fetch(function() {
  
  var pkg = self.dependencies.basePackages[pkgName];
  if (pkg) {
    // remove that bad boy from smart.json and reset our dependencies
    var smartJson = self.readSmartJson();
    delete smartJson.packages[pkgName];
    self.writeSmartJson(smartJson);
    
    // maybe a hack to read it back out from disk, but not a big deal I don't think
    self.checkSmartJson(true);
    
    // now bring everything in line with smart.json
    self.install(function() {
      // finally remove package from packages/
      pkg.removeFrom(self, fn);
    });
  } else {
    fn();
  }
}

// migrate to troposphere! Woot
Project.prototype.migrate = function(fn) {
  var self = this;
  
  console.log("Updating all references to packages in .meteor/packages".green);
  var packages = fs.readFileSync(path.join(self.root, '.meteor', 'packages')).toString();
  
  // work from smart.json grabbing all versions of dependencies
  self.initFromLock();
  var migrated = {}, nonMigrated = {}, failed = [], smartJson = this.readSmartJson();
  
  var done = function() {
    if (failed.length) {
      _.each(failed, function(message) {
        console.log(message.red);
      });
      console.log('');
      var message = 
      console.log('If you want to continue, remove the package(s) from smart.json, run `mrt install`, and try again.'.yellow);
      console.log('After you have successfully migrated, you can add them back but note:'.yellow);
      console.log('  You will NOT receive further updates!.'.red);
      console.log('See https://hackpad.com/Migrating-Apps-UfPrM192vSQ for more information.'.yellow);
      process.exit(1);
    }
    
    // write .meteor/packages
    console.log("2.1 Writing packages.js".green);
    fs.writeFileSync(path.join(self.root, '.meteor', 'packages'), packages);
    
    if (_.keys(nonMigrated).length) {
      console.log("2.2. Rewriting smart.json".green);
      self.writeSmartJson(smartJson);
    } else {
      console.log("2.2. Removing smart.json/smart.lock".green);
      
      // remove smart.json/smart.lock
      fs.unlinkSync(path.join(self.root, 'smart.json'));
      fs.unlinkSync(path.join(self.root, 'smart.lock'));
    }
    
    // remove packages/name for each package
    _.each(migrated, function(pkg) {
      var packagePath = path.join(self.root, 'packages', pkg.name);
      if (fs.existsSync(packagePath))
        fs.unlinkSync(packagePath);
    });
    
    // if packages dir only contains .gitignore, remove it
    var files = fs.readdirSync(path.join(self.root, 'packages'));
    if (files.length === 0 || (files.length === 1 && files[0] === '.gitignore') ) {
      wrench.rmdirSyncRecursive(path.join(self.root, 'packages'));
    }
    
    self.install(function() {
      console.log("3. Done. For more information, please check out https://hackpad.com/Migrating-Apps-UfPrM192vSQ".green);
      fn();
    });
  }
  
  var complete = 0;
  var bail = function() {
    failed.push(Array.prototype.join.call(arguments, ' '));
    complete += 1;
  }
  
  _.each(self.dependencies.basePackages, function(pkg) {
    var name = pkg.name;
    
    if (! pkg._fromAtmosphere) {
      nonMigrated[name] = pkg;
      complete += 1;
      console.log(("1." + complete + "  Didn't migrate " + name + " as it was a non-atmosphere package").yellow);
      
      if (complete === _.keys(self.dependencies.basePackages).length)
        done()
      
      return;
    }
    
    var versionName = pkg.version;
    Atmosphere.package(name, function(pkg) {
      if (! pkg)
        return bail("Error: no package named ", name, " found on Atmosphere");
      
      // either the version specified directly in smart.json, or the one 
      //   resolved in smart.lock
      var searchFor = versionName;
      if (! searchFor)
        searchFor = self.dependencies.packages[name].source.config.tag.replace(/^v/, '');
      var version = _.find(pkg.versions, function(v) { 
        return v.version === searchFor;
      });
      if (! version)
       return bail("Error: couldn't find version", searchFor,
          "of package", name, "on Atmosphere");
      
      if (! version.troposphereIdentifier)
        return bail("Error: The version", searchFor, 
          "of package", name, "has not yet been migrated");
      
      var id = version.troposphereIdentifier;
      // we want to fix the version, not just say at least the version
      if (versionName)
        id = id.replace('@', '@=');
      
      // we are good, replace references to name with troposphereId
      packages = packages.replace(new RegExp('^' + name + '$', 'm'), id);
      
      // remove from smart.json
      delete smartJson.packages[name];
      
      migrated[name] = pkg;
      complete += 1;
      console.log(("1." + complete + ". Will update " + name + " to " + id).green);
      if (complete === _.keys(self.dependencies.basePackages).length)
        done()
    });
  });
  
  if (_.keys(self.dependencies.packages).length === 0)
    done();
}


// Is the package part of the meteor install, or is it a dependency?
//
// NOTE: assumes we have fetched. FIXME: figure out a better / systematic way
// to write code that has this sort of assumption
Project.prototype.hasPackage = function(pkgName, fn) {
  if (this.dependencies.packages[pkgName]) {
    return fn(true);
  }
  
  this.meteor.hasPackage(pkgName, fn)
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

Project.prototype._optimizeFS = function() {
  var self = this;

  var deletable = [];
  
  // remove old .meteor/meteorite directory
  var oldInstallRoot = path.join(this.root, '.meteor', 'meteorite')
  if (fs.existsSync(oldInstallRoot)) {
    deletable.push(oldInstallRoot);
  }
  
  if (deletable.length > 0)
    console.log("Yay! We're optimizing your installation!".yellow.bold);
  
  _.each(deletable, function(filePath) {
    console.log("  ✘ ".red + ("Deleting " + filePath).grey);

    if (fs.lstatSync(filePath).isDirectory())
      wrench.rmdirSyncRecursive(filePath);
    else
      fs.unlink(filePath);
  });
};

module.exports = Project;

// var _debug = require('./debug');
// _.debugClass('Project');
