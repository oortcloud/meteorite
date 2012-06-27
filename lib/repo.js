var path = require('path');
var spawn = require('child_process').spawn;

Repo = {};

Repo.fetch = function(onComplete) {
    var self = this;

    var checkout = function() {
      self._gitCheckout(onComplete);
    };

    if (self._isCloned())
      self._gitPull(checkout);
    else
      self._gitClone(checkout);
  
};

Repo._gitPull = function(onComplete) {
  var self = this;
  var prevDir = process.cwd();
  process.chdir(this.path);

  spawn('git', ['pull']).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not pull', self.name);

    process.chdir(prevDir);
    onComplete();
  });
};

Repo._gitClone = function(onComplete) {
  var self = this;

  spawn('git', ['clone', this.repo.url, this.path]).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not be cloned', self.name);
    onComplete();
  });
};

Repo._gitCheckout = function(onComplete) {
  var self = this;
  var branch = this.repo.head;
  var prevDir = process.cwd();
  process.chdir(this.path);

  spawn('git', ['checkout', branch]).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not checkout', self.name);

    process.chdir(prevDir);
    onComplete();
  });
};

Repo._isCloned = function() {
  return path.existsSync(path.join(this.path, '.git'));
};

module.exports = Repo;
