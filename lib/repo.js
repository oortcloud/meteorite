var _ = require('underscore');
var path = require('path');
var spawn = require('child_process').spawn;

Repo = function(config) {

  // Apply configuration
  _.extend(this, {
    checkout: this._checkoutType(config),
    head: this._checkoutHead(config),
    url: config.git
  });

};

Repo.prototype.fetch = function(fn) {
  var self = this;

  // Clone, pull, and checkout
  if (!self._isCloned())
    self._gitClone(function() {
      self._gitPull(function() {
        self._gitCheckout(fn);
      });
    });

  // Continue if we already have this repo
  else
    fn();

};

Repo.prototype._gitPull = function(fn) {
  
  // Just pull everything
  spawn('git', ['pull'], {cwd: this.path}).on('exit', fn);
};

Repo.prototype._gitClone = function(fn) {
  
  // Do actual cloning to disk
  spawn('git', ['clone', this.url, this.path]).on('exit', fn);
};

Repo.prototype._gitCheckout = function(fn) {

  // Do actual checkout
  spawn('git', ['checkout', this.head], {cwd: this.path}).on('exit', fn);
};

Repo.prototype._isCloned = function() {

  // If the path exists and there's a .git 
  // dir it should be ready to go
  return path.existsSync(path.join(this.path, '.git'));

};

Repo.prototype._checkoutType = function(config) {
  
  // Figure out what kind of checkout we're doing
  // i.e., is it a branch, ref, or tag
  var types = ['branch', 'ref', 'tag'];
  var type = _.find(types, function(type) {
    return !_.isUndefined(config[type]);
  });

  // Default to branch
  return type || 'branch';

};

Repo.prototype._checkoutHead = function(config) {
  
  // Figure out what we want HEAD to point to
  return config.branch || config.ref || config.tag || 'master';

};

module.exports = Repo;
