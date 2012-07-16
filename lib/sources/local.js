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


LocalSource.prototype.toJson = function(lock) {
  
  return {path: this.path};
};

// TODO: Not sure this is the best name for a shared interface
LocalSource.prototype.packagePath = function() {
  return this.path;
};

// is this source installed into this directory? 
LocalSource.prototype.installedInto = function(path, fn) {
  var self = this;
  
  fs.readLink(path, function(err, linkPath) {
    // will obviously not work if there's an err (ie path isn't a symlink)
    fn(linkPath === self.path);
  });
}


module.exports = LocalSource;