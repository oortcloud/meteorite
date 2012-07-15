var _ = require('underscore');
var path = require('path');
var wrench = require('wrench');
var fs = require('fs');
var url = require('url');
var spawn = require('child_process').spawn;
var fstream = require('fstream');

GitSource = function(basePath, config, fn) {

  // Setup
  this.config = config;
  this.sourceBasePath = path.join(Meteorite.root(), 'source');
  this.basePath = basePath;
  this.loaded = false;

  // Apply configuration
  this.checkoutType = this._checkoutType();
  this.head = this._checkoutHead();
  this.url = config.git;

  this.commit = this._commit();

  // Figure out path
  this.path = this.packagePath();
  this.sourcePath = this.sourcePath();

};

GitSource.prototype.isLoaded = function() {
  return this.loaded;
};

GitSource.prototype.packagePath = function() {
  return path.join(this.basePath, this.packageNamespace(), this.checkoutType, this.head);
};

GitSource.prototype.sourcePath = function() {
  return path.join(this.sourceBasePath, this.packageNamespace());
};

GitSource.prototype.packageNamespace = function() {
  var urlParts = url.parse(this.url);
  return urlParts.path.replace(/.git$/, '').replace(/^\//, '');
};

GitSource.prototype.fetch = function(fn) {
  var self = this;
  
  // don't need to do anything
  // TODO -- check the path exists, raise exception otherwise
  if (self.loaded)
    return fn();
  
  // Clone, pull, and checkout
  self._gitClone(function() {
    self._gitPull(function() {
      self._gitCheckout(function() {
        self.loaded = true;
        fn();
      });
    });
  });

};

GitSource.prototype.toString = function() {
  return '(' + this.checkoutType + ': ' + this.head + ')';
};

GitSource.prototype._gitPull = function(fn) {
  
  // Just pull everything
  spawn('git', ['pull'], {cwd: this.sourcePath}).on('exit', fn);
};

GitSource.prototype._gitClone = function(fn) {
  // Do actual cloning to disk
  spawn('git', ['clone', this.url, this.sourcePath]).on('exit', fn);
};

GitSource.prototype._gitCheckout = function(fn) {
  // TODO ideally we'd do something like this here but I couldn't get it to work:
  //     git archive master | tar -x -C /path/to/destination

  var self = this;

  // Make sure we have a place for this to go
  if (!fs.existsSync(self.path))
    wrench.mkdirSyncRecursive(self.path);

  // Do actual checkout
  spawn('git', ['checkout', self.head], {cwd: self.sourcePath}).on('exit', function() {
    // Copy everything over
    var reader = fstream.Reader(self.sourcePath);
    var writer = fstream.Writer(self.path);

    // Ok fs copy is done
    writer.on('close', function() {

      // Cleanup
      var gitDir = path.join(self.path, '.git');
      if (!self.config.keepGitDir && fs.existsSync(gitDir))
        wrench.rmdirSyncRecursive(gitDir);
      fn();

    });

    // Start shit up!
    reader.pipe(writer);

  });

};

GitSource.prototype._checkoutType = function() {
  var self = this;
  
  // Figure out what kind of checkout we're doing
  // i.e., is it a branch, ref, or tag
  var types = ['branch', 'ref', 'tag'];
  var type = _.find(types, function(type) {
    return !_.isUndefined(self.config[type]);
  });

  // Default to branch
  return type || 'branch';

};

GitSource.prototype._checkoutHead = function() {
  
  // Figure out what we want HEAD to point to
  return this.config.branch || this.config.ref || this.config.tag || 'master';

};

GitSource.prototype.smartJson = function() {
  
  var json = {git: this.url};
  json[this.checkoutType] = this.head;
  
  return json;
};

GitSource.prototype._commit = function() {
  if (this.checkoutType === 'branch')
    return;
  else
    return this.head;
};

GitSource.prototype.equals = function(otherSource) {
  
  return (otherSource.url === this.url &&
    otherSource.checkoutType === this.checkoutType &&
    otherSource.head === this.head);
};

module.exports = GitSource;
