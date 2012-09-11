var fs = require('fs');

// NOTE: config.path MUST be absolute. Otherwise behaviour is undefined
LocalSource = function(basePath, config) {
  this.config = config;
  
  this.specifiedPath = config.specifiedPath || config.path;
  this.path = config.path;
};

LocalSource.prototype.toString = function() {
  return this.path;
};

LocalSource.prototype.smartJson = function() {
  
  return {path: this.specifiedPath};
};

LocalSource.prototype.equals = function(otherSource) {
  return otherSource && otherSource.specifiedPath === this.specifiedPath;
};

LocalSource.prototype.fetch = function(fn) {
  if (!fs.existsSync(this.path))
    throw 'Path does not exist: ' + this.path;
  
  fn();
};


LocalSource.prototype.toJson = function(lock) {
  return { path: this.specifiedPath };
};

// TODO: Not sure this is the best name for a shared interface
LocalSource.prototype.packagePath = function() {
  return this.path;
};

// is this source installed into this directory? 
LocalSource.prototype.installedInto = function(path, fn) {
  var self = this;
  
  fs.readlink(path, function(err, linkPath) {
    // will obviously not work if there's an err (ie path isn't a symlink)
    fn(linkPath === self.path);
  });
};

LocalSource.prototype.conflictsWith = function(otherSource) {
  if (otherSource instanceof GitSource)
    // wow, they are pointing at the same place!
    if (this.equals(otherSource))
      return false;
    else
      return true
      
  else if (otherSource instanceof LocalSource)
    return true
}

LocalSource.prototype.overrides = function(otherSource) {
  if (otherSource instanceof LocalSource)
    return false;
  else
    return true;
}

module.exports = LocalSource;