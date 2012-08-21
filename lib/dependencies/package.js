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
  root = path.join(Package.installRoot(), this.name);
  
  // Prepare source
  config = _.extend({name: this.name}, config); // <- copy over attributes, mainly to not screw up tests
  this.source = Source.prepare(root, config);

};

Package.prototype.fetch = function(fn) {
  var self = this;
  
  // Fetch the package source
  self.source.fetch(fn, 'Fetching package ' + this.name);
};

Package.prototype.readConfig = function(fn) {
  var self = this;
  
  // we need to be fetched to do this
  self.fetch(function() {
    
    self.config = new Config(self.source.packagePath());
    fn();
  });
};

Package.prototype.readDependencies = function(fn) {
  var self = this;
  
  self.readConfig(function() {
    
    self.dependencies = new Dependencies(self.source.packagePath(), self.config.packages);
    fn();
  });
};


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

// simplistic for the moment
Package.prototype.equals = function(otherPkg) {
  
  return this.source.equals(otherPkg.source);
};

// an object version of this to be JSONed.
Package.prototype.toJson = function(lock) {
  return this.source.toJson(lock);
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
