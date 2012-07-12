var _ = require('underscore');
var path = require('path');
var fs = require('fs');

Package = function(name, config) {
  this.name = name;
  var root = path.join(Package.installRoot(), this.name);
  
  // Init source
  if (config.path)
    this.source = new LocalSource(root, config);
  else
    this.source = new GitSource(root, config);

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

Package.prototype.fetch = function(project, fn) {
  var self = this;

  console.log('Fetching package ' + this.name + ' ' + self.source + '...');

  // Fetch the package source
  self.source.fetch(function() {
    self.prepare(project, fn);
  });
  
};

Package.prototype.prepare = function(project, fn) {
  var self = this;

  // If package has it's own dependencies we need to get them
  if (self.hasSmartJson()) {
    
    // Make a config object from package's `smart.json`
    var config = new Config(self.libPath());

    // Process sub-dependencies
    var packages = new Packages(project, config.packages);
    self.packages = packages.packages;
    packages.fetch(fn);

  } else {
    
    // Ok we fetched it, make a note of it
    fn();
  }
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
