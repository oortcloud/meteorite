var path = require('path');

LocalSource = function(basePath, config) {
  this.path = path.resolve(config.path);
};

LocalSource.prototype.isLoaded = function() {
  return true;
};

LocalSource.prototype.toString = function() {
  return '(' + this.path + ')';
};

module.exports = LocalSource;