var _ = require('underscore');
var path = require('path');
var spawn = require('child_process').spawn;

Repo = function(options) {
  _.extend(this, options);
};

Repo.prototype.fetch = function(fn) {
    var self = this;

    var checkout = function() {
      self._gitCheckout(fn);
    };

    if (self._isCloned())
      self._gitPull(checkout);
    else
      self._gitClone(checkout);
  
};

Repo.prototype._gitPull = function(fn) {
  var self = this;
  var prevDir = process.cwd();
  process.chdir(this.path);
  
  var gitPull = spawn('git', ['pull', 'origin', 'master']);
  
  gitPull.on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not pull', self.name);

    process.chdir(prevDir);
    fn();
  });
};

Repo.prototype._gitClone = function(fn) {
  var self = this;

  spawn('git', ['clone', this.url, this.path]).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not be cloned', self.name);
    fn();
  });
};

Repo.prototype._gitCheckout = function(fn) {
  var self = this;
  var branch = this.head;
  var prevDir = process.cwd();

  process.chdir(this.path);

  spawn('git', ['checkout', branch]).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not checkout', self.name);

    process.chdir(prevDir);
    fn();
  });
};

Repo.prototype._isCloned = function() {
  return path.existsSync(path.join(this.path, '.git'));
};

module.exports = Repo;
