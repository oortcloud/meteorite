var _ = require('underscore');
var path = require('path');
var fs = require('fs');

Package = function(package) {
  _.extend(this, package);
  this.repo.path = path.join(Meteorite.root(), 'packages', this.name, this.repo.checkout, this.repo.head);
};

Package.prototype.libPath = function() {
  var libPath;
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
  
  findPackage(this.repo.path);
  return libPath;
};

module.exports = Package;
