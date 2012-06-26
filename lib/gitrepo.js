var _ = require('underscore');
var path = require('path');
var spawn = require('child_process').spawn;

GitRepo = function(options) {
  _.extend(this, options);
  this.path = path.join(this.rootDest, this.name);
};

GitRepo.prototype.gitPull = function(fn) {
  var self = this;
  process.chdir(this.path);

  var gitPull = spawn('git', ['pull']);

  gitPull.on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not pull', self.name);
    fn();
  });
};

GitRepo.prototype.gitClone = function(fn) {
  var self = this;
  process.chdir(this.rootDest);

  var gitClone = spawn('git', ['clone', this.config.git, this.path]);

  gitClone.on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not be cloned', self.name);
    fn();
  });
};

GitRepo.prototype.gitCheckout = function(fn) {
  var self = this;
  var branch = this.config.branch || 'master';
  process.chdir(this.path);

  var gitPull = spawn('git', ['checkout', branch]);

  gitPull.on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not pull', repoName);
    fn();
  });
};

GitRepo.prototype.isCloned = function() {
  return path.existsSync(path.join(this.path, '.git'));
};

GitRepo.prototype.prepare = function(fn) {
  var self = this;

  var checkout = function() {
    self.gitCheckout(fn);
  };

  if (this.isCloned())
    this.gitPull(checkout);
  else
    this.gitClone(checkout);
};

module.exports.GitRepo = GitRepo;
