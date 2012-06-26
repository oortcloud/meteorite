var _ = require('underscore');
var path = require('path');
var spawn = require('child_process').spawn;
var fs = require('fs');
var wrench = require('wrench');

Package = function(options) {
  this._findMeteoriteDir();
  this._prepareFS();
  _.extend(this, options);
  this.path = path.join(this.meteoriteDir, 'packages', this.name, options.repo.checkout, options.repo.head);
};

Package.prototype._gitPull = function(onComplete) {
  var self = this;
  process.chdir(this.path);

  spawn('git', ['pull']).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not pull', self.name);
    onComplete();
  });
};

Package.prototype._gitClone = function(onComplete) {
  var self = this;

  spawn('git', ['clone', this.repo.url, this.path]).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not be cloned', self.name);
    onComplete();
  });
};

Package.prototype._gitCheckout = function(onComplete) {
  var self = this;
  var branch = this.repo.head;
  process.chdir(this.path);

  spawn('git', ['checkout', branch]).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not checkout', self.name);
    onComplete();
  });
};

Package.prototype._isCloned = function() {
  return path.existsSync(path.join(this.path, '.git'));
};

Package.prototype.prepare = function(onComplete) {
  var self = this;

  var checkout = function() {
    self._gitCheckout(onComplete);
  };

  if (this._isCloned())
    this._gitPull(checkout);
  else
    this._gitClone(checkout);
    
};

Package.prototype.linkTo = function(packagesPath) {
  var self = this;
  var packageDir = path.join(packagesPath, self.name);
  var realPath;

  try {
    realPath = fs.readlinkSync(packageDir)
  } catch(e) {}

  if (realPath) {
    wrench.rmdirSyncRecursive(packageDir);
  }
  fs.symlinkSync(this.path, packageDir);
};

Package.prototype._findMeteoriteDir = function() {
  var homeDir = process.env.HOME;
  this.meteoriteDir = path.join(homeDir, '.meteorite');
};

Package.prototype._prepareFS = function() {
  if (!path.existsSync(this.meteoriteDir))
    fs.mkdir(this.meteoriteDir);
};

module.exports.Package = Package;
