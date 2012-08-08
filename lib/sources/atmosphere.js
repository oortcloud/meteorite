var _ = require('underscore');
var GitSource = require('./git');

// A source for packages -- meta data stored on the atmosphere server
// encapsulates a GitSource AFTER it's been fetched (and thus knows where to point it)
AtmosphereSource = function(basePath, config) {

  // Setup
  this.config = config;
  this.basePath = basePath;
};

AtmosphereSource.prototype.fetch = function(fn, message) {
  var self = this;
  
  if (self.git)
    return self.git.fetch(fn, message);
  
  // Ok, let's work out our git definition from the atmosphere server
  Atmosphere.packages(function(defns) {
    
    // search through the definitions for one that we fit
    var pkg_definition = _.find(defns, function(d) { return d.name === self.config.name; });
    
    if (!pkg_definition)
      throw 'No package named ' + self.config.name + ' was found in the atmosphere database';
    
    // now search through the versions too
    var version = self.config.version || pkg_definition.latest;
    
    var version_definition = _.find(pkg_definition.versions, function(v) { 
      return v.version === version; 
    });
    if (!version_definition)
      throw 'No version ' + version + ' of package ' + self.config.name + ' was found in the atmosphere database';
    
    // TODO --> use this!
    self.packages = version_definition.packages;
    
    // now prepare the git source from what we've just discovered
    self.git = new GitSource(self.basePath, {
      git: version_definition.git,
      tag: version
    });
    
    // now fetch the git repo
    self.git.fetch(fn, message);
  });
};

AtmosphereSource.prototype.toString = function() {
  
  return '(' + this.config.name + ')';
};

AtmosphereSource.prototype.equals = function(otherSource) {
  return otherSource.config.name === this.config.name && 
    otherSource.config.version == this.config.version;
};

// TODO -- write out git stuff and rebuild from that if locking
//
AtmosphereSource.prototype.toJson = function(lock) {
  if (lock)
    return this.git.toJson(true);
  
  var json = {};
  if (this.config.version)
    json.version = this.config.version;
  
  return json;
};

// is this source installed into this directory? 
AtmosphereSource.prototype.installedInto = function(path, fn) {
  
  return this.git.installedInto(path, fn);
};

// FIXME.. ?
AtmosphereSource.prototype.packagePath = function() {
  
  return this.git.packagePath();
}

module.exports = AtmosphereSource;