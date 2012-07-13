var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var Source = require('./sources/source');

Package = function(name, config) {
  this.name = name;
  var root = path.join(Package.installRoot(), this.name);
  
  // Prepare source
  this.source = Source.prepare(root, config);

};

Package.prototype.hasSmartJson = function() {

  // Build up path
  var jsonPath = path.join(this.libPath(), 'smart.json');

  // Make sure path exists
  return path.existsSync(jsonPath);

};

Package.prototype.installInto = function(project) {
  
  // Figure out where it should go
  var packagePath = path.join(project.packagesRoot, this.name);

  // Destroy old link
  fs.unlink(packagePath);
  
  // Make new link
  fs.symlinkSync(this.libPath(), packagePath);
};

Package.prototype.fetch = function(fn) {
  var self = this;

  console.log('Fetching package ' + this.name + ' ' + self.source + '...');

  // Fetch the package source
  self.source.fetch(fn);
  
};

Package.prototype.libPath = function() {

  var libPath;

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
  findPackage(this.source.path);

  // Return found path or nothing
  return libPath;

};

Package.installRoot = function() {
  return path.join(Meteorite.root(), 'packages');
};

module.exports = Package;
