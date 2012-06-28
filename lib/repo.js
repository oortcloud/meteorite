var path = require('path');
var spawn = require('child_process').spawn;

Repo = {};

Repo.fetch = function(fn) {
    var self = this;

    var checkout = function() {
      self._gitCheckout(fn);
    };

    if (self._isCloned())
      self._gitPull(checkout);
    else
      self._gitClone(checkout);
  
};

Repo._gitPull = function(fn) {
  var self = this;
  var prevDir = process.cwd();
  // TODO origin and master should not be hardcoded
  var gitPull = spawn('git', ['pull', 'origin', 'master']);
  
  // gitPull.stdout.on('data', function(data) {
  //   console.log('out', data.toString());
  // });
  // gitPull.stderr.on('data', function(data) {
  //   console.log('err', data.toString());
  // });
  
  gitPull.on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not pull', self.name);

    process.chdir(prevDir);
    fn();
  });
};

Repo._gitClone = function(fn) {
  var self = this;

  spawn('git', ['clone', this.repo.url, this.path]).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not be cloned', self.name);
    fn();
  });
};

Repo._gitCheckout = function(fn) {
  var self = this;
  var branch = this.repo.head;
  var prevDir = process.cwd();

  process.chdir(this.path);

  spawn('git', ['checkout', branch]).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not checkout', self.name);

    process.chdir(prevDir);
    fn();
  });
};

Repo._isCloned = function() {
  return path.existsSync(path.join(this.path, '.git'));
};

module.exports = Repo;
