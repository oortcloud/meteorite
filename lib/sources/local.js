var fs = require('fs');

// NOTE: config.path MUST be absolute. Otherwise behaviour is undefined
LocalSource = function(basePath, config) {
  this.path = config.path;
  
  if (!fs.existsSync(this.path))
    throw 'Path does not exist: ' + this.path;
};

LocalSource.prototype.isLoaded = function() {
  return true;
};

LocalSource.prototype.toString = function() {
  return '(' + this.path + ')';
};

LocalSource.prototype.smartJson = function() {
  
  return {path: this.path};
};

LocalSource.prototype.equals = function(otherSource) {
  return otherSource.path === this.path;
};

LocalSource.prototype.fetch = function(fn) {
  
  // do nothing
  fn();
};

module.exports = LocalSource;