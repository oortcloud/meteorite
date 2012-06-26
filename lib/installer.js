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
      repo: self._parseRepoConfig(config)
    });

    package.prepare(onPrepared);
    
    return package;
  });
};

Installer.prototype._installMeteor = function(onComplete) {
  var self = this;

  var meteor = _.find(this.packages, function(package) {
    return package.name === 'meteor';
  });
  
  var meteorsDir = path.join(this.meteoriteDir, 'meteors');
  var projectMeteorPath = path.join(meteorsDir, this.projectKey);
  var projectPackagesPath = path.join(projectMeteorPath, 'packages');

  if (path.existsSync(projectMeteorPath))
    wrench.rmdirSyncRecursive(projectMeteorPath);

  wrench.mkdirSyncRecursive(projectMeteorPath);

  var reader = fstream.Reader(meteor.path);
  var writer = fstream.Writer(projectMeteorPath);

  writer.on("close", function() {
    var complete = 0;
    _.each(self.packages, function(package) {


      if (package.name !== 'meteor')
        package.linkTo(projectPackagesPath);

      if (complete >= self.packages.length - 1)
        onComplete();

      complete++;
    });
  })

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
  } catch(e) {}
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
