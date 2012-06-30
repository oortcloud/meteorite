var _ = require('underscore');
var path = require('path');
var spawn = require('child_process').spawn;

Repo = function(options) {
  this._prepare(options);
};

Repo.prototype.fetch = function(fn) {
  var self = this;
  var checkout = function() {
    self._gitCheckout(fn);
  };

  if (!self._isCloned()) {
    self._gitClone(function() {
      self._gitPull(checkout);
    });
  } else {
    fn();
  }
};

Repo.prototype._gitPull = function(fn) {
  var self = this;
  var prevDir = process.cwd();
  process.chdir(this.path);

  var gitPull = spawn('git', ['pull']);
  
  gitPull.on('exit', function (code) {
    process.chdir(prevDir);
    fn();
  });
};

Repo.prototype._gitClone = function(fn) {
  var self = this;

  spawn('git', ['clone', this.url, this.path]).on('exit', function (code) {
    fn();
  });
};

Repo.prototype._gitCheckout = function(fn) {
  var self = this;
  var branch = self.head;
  var prevDir = process.cwd();
  process.chdir(self.path);

  spawn('git', ['checkout', branch]).on('exit', function (code) {
    process.chdir(prevDir);
    fn();
  });
};

Repo.prototype._isCloned = function() {
  return path.existsSync(path.join(this.path, '.git'));
};

Repo.prototype._prepare = function(config) {
  _.extend(this, {
    checkout: this._checkoutType(config),
    head: this._checkoutHead(config),
    url: config.git
  });
};

Repo.prototype._checkoutType = function(config) {
  var types = ['branch', 'ref', 'tag'];
  var type = _.find(types, function(type) {
    return !_.isUndefined(config[type]);
  });
  return type || 'branch';
};

Repo.prototype._checkoutHead = function(config) {
  return config.branch || config.ref || config.tag || 'master';
};

module.exports = Repo;
