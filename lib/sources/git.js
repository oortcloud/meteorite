var _ = require('underscore');
var path = require('path');
var spawn = require('child_process').spawn;

GitSource = function(basePath, config) {

  // Setup
  this.loaded = false;

  // Apply configuration
  _.extend(this, {
    checkout: this._checkoutType(config),
    head: this._checkoutHead(config),
    url: config.git
  });
  
  // Figure out path
  this.path = path.join(basePath, this.checkout, this.head);
  
};

GitSource.prototype.isLoaded = function() {
  return this.loaded;
};

GitSource.prototype.fetch = function(fn) {
  var self = this;
  
  // don't need to do anything
  // TODO -- check the path exists, raise exception otherwise
  if (self.loaded)
    return fn();
  
  // Clone, pull, and checkout
  self._gitClone(function() {
    self._gitPull(function() {
      self._gitCheckout(function() {
        self.loaded = true;
        fn();
      });
    });
  });

};

GitSource.prototype.toString = function() {
  return '(' + this.checkout + ': ' + this.head + ')';
};

GitSource.prototype._gitPull = function(fn) {
  
  // Just pull everything
  spawn('git', ['pull'], {cwd: this.path}).on('exit', fn);
};

GitSource.prototype._gitClone = function(fn) {
  
  // Do actual cloning to disk
  spawn('git', ['clone', this.url, this.path]).on('exit', fn);
};

GitSource.prototype._gitCheckout = function(fn) {
  // Do actual checkout
  spawn('git', ['checkout', this.head], {cwd: this.path}).on('exit', fn);
};

GitSource.prototype._checkoutType = function(config) {
  
  // Figure out what kind of checkout we're doing
  // i.e., is it a branch, ref, or tag
  var types = ['branch', 'ref', 'tag'];
  var type = _.find(types, function(type) {
    return !_.isUndefined(config[type]);
  });

  // Default to branch
  return type || 'branch';

};

GitSource.prototype._checkoutHead = function(config) {
  
  // Figure out what we want HEAD to point to
  return config.branch || config.ref || config.tag || 'master';

};

GitSource.prototype.smartJson = function() {
  
  if (this.local)
    return {path: this.path};
  else {
    var json = {git: this.url};
    json[this.checkout] = this.head;
    
    return json;
  }
};

module.exports = GitSource;
