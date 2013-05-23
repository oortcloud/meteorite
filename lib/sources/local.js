var fs = require('fs');
var path = require('path');

// NOTE: config.path MUST be absolute. Otherwise behaviour is undefined
LocalSource = function(basePath, config) {
  this.config = config;
  
  this.specifiedPath = config.path;
  this.path = path.resolve(config.root || '.', config.path);
};

LocalSource.prototype.toString = function() {
  return this.path;
};

LocalSource.prototype.smartJson = function() {
  
  return {path: this.specifiedPath};
};

LocalSource.prototype.fetch = function(fn) {
  if (!fs.existsSync(this.path))
    throw('Path does not exist: ' + this.path);
  
  fn();
};

LocalSource.prototype.toJson = function(lock) {
  // XXX: it is wrong to check the path relative to the current directory?
  var relPath = path.relative('.', this.path);
  return { path: relPath || '.'};
};

// TODO: Not sure this is the best name for a shared interface
LocalSource.prototype.packagePath = function() {
  return this.path;
};

LocalSource.prototype.equals = function(otherSource) {
  return otherSource && (otherSource.path === this.path);
};

LocalSource.prototype.conflictsWith = function(otherSource) {
  if (otherSource instanceof LocalSource)
    // wow, they are pointing at the same place!
    if (this.equals(otherSource))
      return false;
    else
      return true
      
  else if (otherSource instanceof GitSource)
    return true
}

LocalSource.prototype.overrides = function(otherSource) {
  if (otherSource instanceof LocalSource)
    return false;
  else
    return true;
}

module.exports = LocalSource;