var _ = require('underscore');
var path = require('path');
var spawn = require('child_process').spawn;

// A repo is the location of a package/meteor. It can either be
// a remote git repository (thus the name), or a local directory
// specified by :path

Repo = function(base_path, config) {

  // Apply configuration
  if (config.path) {
    this.local = true;
    this.path = config.path
  } else {
    _.extend(this, {
      checkout: this._checkoutType(config),
      head: this._checkoutHead(config),
      url: config.git
    });
    this.path = path.join(base_path, this.checkout, this.head);
  }
};

Repo.prototype.fetch = function(fn) {
  var self = this;
  
  // don't need to do anything
  // TODO -- check the path exists, raise exception otherwise
  if (self.local || self.isCloned())
    return fn();
  
  // Clone, pull, and checkout
  self._gitClone(function() {
    self._gitPull(function() {
      self._gitCheckout(fn);
    });
  });

};

Repo.prototype.isCloned = function() {

  // If the path exists and there's a .git 
  // dir it should be ready to go
  return path.existsSync(path.join(this.path, '.git'));

};

Repo.prototype.sourceString = function() {
  if (this.local) {
    return '(' + this.path + ')';
  } else {
    return '(' + this.checkout + ': ' + this.head + ')';
  }
}

Repo.prototype._gitPull = function(fn) {
  // Just pull everything
  var git = spawn('git', ['pull'], {cwd: this.path}).on('exit', fn);
  git.stderr.pipe(process.stderr);
};

Repo.prototype._gitClone = function(fn) {
  // Do actual cloning to disk
  var git = spawn('git', ['clone', this.url, this.path]).on('exit', fn);
  git.stderr.pipe(process.stderr);
};

Repo.prototype._gitCheckout = function(fn) {
  // Do actual checkout
  var git = spawn('git', ['checkout', this.head], {cwd: this.path}).on('exit', fn);
  git.stderr.pipe(process.stderr);
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

Repo.prototype.smartJson = function() {
  
  if (this.local)
    return {path: this.path}
  else {
    var json = {git: this.url};
    json[this.checkout] = this.head;
    
    return json;
  }
}


module.exports = Repo;
