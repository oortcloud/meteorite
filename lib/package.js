var _ = require('underscore');
var path = require('path');
var fs = require('fs');

Package = function(pkg) {

  // Apply all package settings
  _.extend(this, pkg);

  // Build up repo path
  this.repo.path = path.join(Meteorite.root(), 'packages', this.name, this.repo.checkout, this.repo.head);

};

Package.prototype.hasSmartJson = function() {

  // Build up path
  var jsonPath = path.join(this.libPath(), 'smart.json');

  // Make sure path exists
  return path.existsSync(jsonPath);

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
  findPackage(this.repo.path);

  // Return found path or nothing
  return libPath;

};

module.exports = Package;
