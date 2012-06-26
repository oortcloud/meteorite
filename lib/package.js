var _ = require('underscore');
var path = require('path');
var spawn = require('child_process').spawn;

Package = function(options) {
  _.extend(this, options);
  this.path = path.join(this.root, this.name, options.repo.checkout, options.repo.head);
};

Package.prototype.gitPull = function(fn) {
  var self = this;
  process.chdir(this.path);

  spawn('git', ['pull']).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not pull', self.name);
    fn();
  });
};

Package.prototype.gitClone = function(fn) {
  var self = this;

  spawn('git', ['clone', this.repo.url, this.path]).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not be cloned', self.name);
    fn();
  });
};

Package.prototype.gitCheckout = function(fn) {
  var self = this;
  var branch = this.repo.head;
  process.chdir(this.path);

  spawn('git', ['checkout', branch]).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not checkout', self.name);
    fn();
  });
};

Package.prototype.isCloned = function() {
  return path.existsSync(path.join(this.path, '.git'));
};

Package.prototype.prepare = function(fn) {
  var self = this;

  var checkout = function() {
    self.gitCheckout(fn);
  };

  if (this.isCloned())
    this.gitPull(checkout);
  else
    this.gitClone(checkout);
};

module.exports.Package = Package;
