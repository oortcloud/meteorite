var _ = require('underscore');
var path = require('path');
var spawn = require('child_process').spawn;

Package = function(options) {
  this._findMeteoriteDir();
  this._prepareFS();
  _.extend(this, options);
  this.path = path.join(this.meteoriteDir, this.name, options.repo.checkout, options.repo.head);
};

Package.prototype._gitPull = function(fn) {
  var self = this;
  process.chdir(this.path);

  spawn('git', ['pull']).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not pull', self.name);
    fn();
  });
};

Package.prototype._gitClone = function(fn) {
  var self = this;

  spawn('git', ['clone', this.repo.url, this.path]).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not be cloned', self.name);
    fn();
  });
};

Package.prototype._gitCheckout = function(fn) {
  var self = this;
  var branch = this.repo.head;
  process.chdir(this.path);

  spawn('git', ['checkout', branch]).on('exit', function (code) {
    if (code !== 0)
      console.log('Error: could not checkout', self.name);
    fn();
  });
};

Package.prototype._isCloned = function() {
  return path.existsSync(path.join(this.path, '.git'));
};

Package.prototype.prepare = function(fn) {
  var self = this;

  var checkout = function() {
    self._gitCheckout(fn);
    self._linkPackage();
  };

  if (this._isCloned())
    this._gitPull(checkout);
  else
    this._gitClone(checkout);
    
};

Package.prototype._linkPackage = function(name, linkPath, fn) {
  this._findMeteor(function() {
    var packageDir = path.join(path.dirname(this.meteorPath), 'packages', name);
    var realPath;
    try {
      realPath = fs.readlinkSync(packageDir)
    } catch(e) {}
  
    if (realPath)
      rm_rf(packageDir, function() {
        fs.symlinkSync(linkPath, packageDir);
        fn();
      });
  });
};

Package.prototype._findMeteor = function(fn) {
  var self = this;
  var whichMeteor = spawn('which', ['meteor']);

  whichMeteor.stdout.on('data', function (data) {
    self.meteorPath = data.toString().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    fn();
  });
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
