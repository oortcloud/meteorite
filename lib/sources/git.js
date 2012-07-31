var _ = require('underscore');
var path = require('path');
var wrench = require('wrench');
var fs = require('fs');
var url = require('url');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fstream = require('fstream');

GitSource = function(basePath, config) {

  // Setup
  this.config = config;
  this.sourceBasePath = path.join(Meteorite.root(), 'source');
  this.basePath = basePath;
  this.loaded = false;
  this.checkoutType = this._checkoutType();
  this.head = this._checkoutHead();
  this.url = config.git;
  this.sourcePath = this.sourcePath();
  this.commit = config.commit;

};
GitSource.prototype.packagePath = function() {
  return path.join(this.basePath, this.packageNamespace(), this.commit);
};

GitSource.prototype.sourcePath = function() {
  return path.join(this.sourceBasePath, this.packageNamespace());
};

GitSource.prototype.packageNamespace = function() {
  var urlParts = url.parse(this.url);
  return urlParts.path.replace(/.git$/, '').replace(/^\//, '');
};

GitSource.prototype.fetch = function(fn, message) {
  var self = this;
  
  // don't need to do anything
  if (self.loaded)
    return fn();
  
  // if the commit has been set manually, we just want to make sure _something_
  // is checked out into our packagePath()
  if (self.commit) {
    self.path = self.packagePath();
    if (fs.existsSync(self.path))
      return fn();
  }
  
  // Clone, pull, and checkout
  console.log(message + ' ' + self + '...');
  self._clone(function() {
    self._pull(function() {
      self._checkout(function() {
        self._commit(function() {
          self.path = self.packagePath();
          self._load(function() {
            self.loaded = true;
            fn();
          });
        });
      });
    });
  });
};

GitSource.prototype._commit = function(fn) {
  var self = this;
  
  GitSource.getCommitForDir(self.sourcePath, function(commit) {
    self.commit = commit;
    fn();
  });
};

GitSource.prototype.toString = function() {
  return '(' + this.checkoutType + ': ' + this.head + ')';
};

GitSource.prototype._pull = function(fn) {
  
  // Just pull everything
  spawn('git', ['pull'], {cwd: this.sourcePath}).on('exit', fn);
};

GitSource.prototype._clone = function(fn) {
  // Do actual cloning to disk
  spawn('git', ['clone', this.url, this.sourcePath]).on('exit', fn);
};

GitSource.prototype._load = function(fn) {
  var self = this;

  if (fs.existsSync(self.path))
    return fn();

  // Make sure we have a place for this to go

  if (!fs.existsSync(self.path))
    wrench.mkdirSyncRecursive(self.path);

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
};

GitSource.prototype._checkout = function(fn) {
  var self = this;

  // Do actual checkout
  spawn('git', ['checkout', self.head], {cwd: self.sourcePath}).on('exit', fn);

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

GitSource.prototype.toJson = function(lock) {
  
  var json = {git: this.url};
  json[this.checkoutType] = this.head;
  if (lock)
    json.commit = this.commit;
  
  return json;
};

GitSource.prototype.equals = function(otherSource) {
  
  // FIXME -- check commit too!
  // FIXME -- what if other source is local?
  return (otherSource.url === this.url &&
    otherSource.checkoutType === this.checkoutType &&
    otherSource.head === this.head);
};

// is this source installed into this directory? 
// (just checks the commit sha, assumes we are at least on the right repo)
GitSource.prototype.installedInto = function(path, fn) {
  var self = this;
  
  GitSource.getCommitForDir(path, function(dirCommit) {
    fn(dirCommit == self.commit);
  });
};

GitSource.getCommitForDir = function(path, fn) {
  exec('git rev-parse HEAD', { cwd: path }, function (err, stdout) {
    fn(stdout.trim());
  });
};

module.exports = GitSource;
