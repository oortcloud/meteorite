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
  Atmosphere.package(self.config.name, function(pkg_definition) {
    
    if (!pkg_definition)
      throw 'No package named ' + self.config.name + ' was found in the atmosphere database';
    
    // now search through the versions too
    var version = self.config.version || pkg_definition.latest;
    
    var version_definition = _.find(pkg_definition.versions, function(v) { 
      return v.version === version; 
    });

    if (!/\d/.test(version[0]))
      throw 'Version should begin with a number: ' + version;

    if (!version_definition)
      throw 'No version ' + version + ' of package ' + self.config.name + ' was found in the atmosphere database';
    
    // TODO --> use this!
    self.packages = version_definition.packages;
    
    // now prepare the git source from what we've just discovered
    self.git = new GitSource(self.basePath, {
      git: version_definition.git,
      tag: 'v' + version
    });
    
    // now fetch the git repo
    self.git.fetch(fn, message);
  });
};

AtmosphereSource.prototype.toString = function() {
  
  return '(' + this.config.name + ')';
};

// same package name, same version if specified
AtmosphereSource.prototype.equals = function(otherSource) {
  
  // TODO The first condition is there because local sources don't 
  // have a config. Maybe there's a more holistic solution?
  if (!otherSource.config || otherSource.config.name !== this.config.name)
    return false;
  
  if (otherSource.config.version && this.config.version)
    return otherSource.config.version == this.config.version;
  
  return true;
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