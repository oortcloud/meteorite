var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Source = require('../sources/source');

// A package represents a single version of a single package
//
// Members:
//   - name -- the name of the package
//   - source -- how it was specified
//   - config -- the configuration that the package specified
//       (empty until readConfig() is called)
//   - dependencies -- the packages that this package depends on
//       (empty until readDependencies is called)
Package = function(name, config) {
  this.name = name;
  this.root = path.join(Package.installRoot(), this.name);
  
  // Prepare source
  config = _.extend({name: this.name}, config); // <- copy over attributes, mainly to not screw up tests
  
  this._fromAtmosphere = !(config.git || config.path);
  if (this._fromAtmosphere) {
    // no source, but store the version
    this.version = config.version;
  } else {
    this.source = Source.prepare(this.root, config);
  }
};

Package.prototype.readDependencies = function(fn) {
  var self = this;
  
  if (self._fromAtmosphere)
    self.readAtmosphereDefinition(fn);
  else
    self.readDependenciesFromSource(fn);
};

// getting info from atmos gets us two things
//   a) the dependencies of the version that we are using
//   b) the git information of the version that we are using.
Package.prototype.readAtmosphereDefinition = function(fn) {
  var self = this;
  
  // Ok, let's work out our git definition from the atmosphere server
  Atmosphere.package(self.name, function(pkg_definition) {
    
    if (!pkg_definition)
      throw 'No package named ' + self.name + ' was found in the atmosphere database';
    
    // now search through the versions too
    var version = self.version || pkg_definition.latest;
    
    var version_definition = _.find(pkg_definition.versions, function(v) { 
      return v.version === version; 
    });
    
    if (! /\d/.test(version[0]))
      throw 'Version should begin with a number: ' + version;

    if (!version_definition)
      throw 'No version ' + version + ' of package ' + self.name + ' was found in the atmosphere database';
    
    // store the dependencies that we just got out
    // NOTE: we can go from this.root, considering no atmos package should specify a path-ed dependency
    self.dependencies = new Dependencies(self.root, version_definition.dependencies);
    
    // now prepare the git source from what we've just discovered
    self.source = new GitSource(self.root, {
      git: version_definition.git,
      tag: 'v' + version
    });
    
    fn();
  });
};

Package.prototype.fetch = function(fn) {
  this.source.fetch(fn, 'Fetching package ' + this.name);
}

Package.prototype.readDependenciesFromSource = function(fn) {
  var self = this;
  
  self.fetch(function() {
    var path = self.source.packagePath();
    var config = new Config(path);
    
    self.dependencies = new Dependencies(path, config.packages);
    fn();
  });
};

Package.prototype.installInto = function(project, fn) {
  var self = this;

  // Figure out where it should go
  var packagePath = path.join(project.packagesRoot, self.name);
  
  self.fetch(function() {
    // blow away a link to the wrong place
    
    var linkedTo = false;
    // grr this is harder than it needs to be
    try {
      linkedTo = fs.readlinkSync(packagePath);
    } catch (err) {
      // pass
    }
    
    if (linkedTo && linkedTo !== self.libPath()) {
      linkedTo = false;
      fs.unlinkSync(packagePath);
    }
    
    // Make link if it doesn't exist, inform caller
    if (! linkedTo) {
      fs.symlinkSync(self.libPath(), packagePath);
      fn(true);
    } else {
      fn(false);
    }
  });
};

// are the package definitions _exactly_ the same?
Package.prototype.equals = function(otherPkg) {
  if (this._fromAtmosphere) {
    return otherPkg._fromAtmosphere && otherPkg.name == this.name &&
      otherPkg.version == this.version;
  } else {
    return this.source.equals(otherPkg.source);
  }
}

// return the way in which this package conflicts with `otherPkg`
//   (so returns `false` if they do not conflict)
Package.prototype.conflictsWith = function(otherPkg) {
  
  if (this._fromAtmosphere) {
    if (otherPkg._fromAtmosphere) {
      if (this.version && otherPkg.version && this.version !== otherPkg.version) {
        var message = 'version (v' + this.version + ') conflicts with version (v' + otherPkg.version + ')';
        return {
          problem: message,
          override: false
        }
      }
      else
        return false;
        
    } else {
      var message = 'one version specified via atmosphere, the other not';
      return {
        problem: message,
        override: false
      }
    }
  }
  
  if (otherPkg._fromAtmosphere)
    return {
      problem: otherPkg.conflictsWith(this).problem,
      override: true
    };
  
  // defer to the sources
  return this.source.conflictsWith(otherPkg.source);
}
 
// FIXME: this assumes that we have fetched, which in general may not be the case.
Package.prototype.libPath = function() {

  var libPath;
  
  // TODO: consider using wrench.readdirRecursive for this? (just a suggestion)
  
  // Go spelunking until we find a package.js so
  // we know where the root of the package lib is 
  var findPackage = function(root) {
    var rootStat = fs.statSync(root);
    _.each(fs.readdirSync(root), function(fileName) {
      var filePath = path.join(root, fileName);
      var fileStat = fs.statSync(filePath);
      if (fileStat.isDirectory()) {
        findPackage(filePath);
      } else if (fileName === 'package.js') {
        libPath = path.dirname(filePath);
      }
    });
  };

  // Go ahead and start looking
  findPackage(this.source.packagePath());

  // Return found path or nothing
  return libPath;

};

Package.prototype.toString = function() {
  var str = this.name;
  if (this._fromAtmosphere) {
    if (this.version)
      str += '(' + this.version + ')';
    else
      str += '(latest)';
  } else {
    str += this.source.toString();
  }
  
  return str;
}

// an object version of this to be JSONed.
Package.prototype.toJson = function(lock) {
  if ((! lock) && this._fromAtmosphere) {
    var json = {};
    if (this.version)
      json.version = this.version;

    return json;
  } else {
    return this.source.toJson(lock);
  }
};

// create a map of names -> packages from a data structure such as you may get from smart.json or smart.lock
// root -> resolve paths relative to this
Package.prepareList = function(root, pkgConfigs) {
  var map = {};
  
  _.each(pkgConfigs, function(config, name) {
    
    map[name] = new Package(name, config);
  });
  
  return map;
};

Package.installRoot = function() {
  return path.join(Meteorite.root(), 'packages');
};

module.exports = Package;
