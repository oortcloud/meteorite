var path = require('path');
var fstream = require('fstream');
var fs = require('fs');
var _ = require('underscore');
_.str = require('underscore.string');
var spawn = require('child_process').spawn;
var Package = require('./package').Package;
var wrench = require('wrench');

_.mixin(_.str.exports());

Installer = function() {
  this._parseDeps();
  this._prepareMeteorDep();
  this._findMeteoriteDir();
  this.projectKey = _.slugify(process.cwd());
};

Installer.prototype.run = function(onComplete) {
  var self = this;

  var installProject = function() {
    self._installMeteor(onComplete);
  };
  
  var preparedCount = 0;
  var onPrepared = function() {
    preparedCount++;
    if (preparedCount >= _.keys(self.deps).length) {
      installProject();
    }
  };

  this.packages = _.map(self.deps, function(config, name) {
    var package = new Package({
      name: name,
      src: (name === 'meteor') ? '' : path.join('src', name),
      repo: self._parseRepoConfig(config)
    });

    package.prepare(onPrepared);
    
    return package;
  });
};

Installer.prototype._installMeteor = function(onComplete) {
  var meteor = _.find(this.packages, function(package) {
    return package.name === 'meteor';
  });
  
  var projectDir = path.join(this.meteoriteDir, 'meteors');
  wrench.mkdirSyncRecursive(projectDir);

  var projectMeteorPath = path.join(projectDir, this.projectKey);
  if (path.existsSync(projectMeteorPath))
    wrench.rmdirSyncRecursive(projectMeteorPath);

  var reader = fstream.Reader(meteor.path);
  var writer = fstream.Writer(projectDir).on("end", onComplete);
  reader.pipe(writer);
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
  } catch(e) {console.log(e);}
};

// TODO not DRY
Installer.prototype._findMeteoriteDir = function() {
  var homeDir = process.env.HOME;
  this.meteoriteDir = path.join(homeDir, '.mrt');
};

Installer.prototype._prepareMeteorDep = function() {
  var url = 'https://github.com/meteor/meteor.git';

  if (!this.deps.meteor)
    this.deps.meteor = { git: url };

  if (!this.deps.meteor.git)
    this.deps.meteor.git = url;
};

module.exports = Installer;
