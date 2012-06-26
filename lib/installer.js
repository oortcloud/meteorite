var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var spawn = require('child_process').spawn;
var rm_rf = require('rimraf');
var Package = require('./package').Package;

Installer = function() {
  this._parseDeps();
  this._prepareMeteorDep();
};

Installer.prototype.run = function(fn) {
  var self = this;
  
  var preparedCount = 0;
  var _prepared = function() {
    preparedCount++;
    if (preparedCount >= _.keys(self.deps).length)
      fn();
  };

  _.each(self.deps, function(config, name) {
    var package = new Package({
      name: name,
      src: path.join('src', name),
      repo: self._parseRepoConfig(config)
    });

    package.prepare(_prepared);
  });
};

Installer.prototype._parseRepoConfig = function(config) {
  return {
    checkout: 'branch',
    head: config.branch || config.ref || config.tag || 'master',
    url: config.git
  };
};

Installer.prototype._parseDeps = function() {
  var projectPath = process.cwd();
  var configPath = path.join(projectPath, 'depend.json');
  try {
    var rawConfig = fs.readFileSync(configPath).toString();
    this.deps = JSON.parse(rawConfig);
  } catch(e) {}
};

Installer.prototype._prepareMeteorDep = function() {
  if (!this.deps.meteor)
    this.deps.meteor = { git: 'https://github.com/meteor/meteor.git' };
};

module.exports = Installer;
