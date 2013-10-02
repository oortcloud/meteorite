var path = require('path');
var _ = require('underscore');
var Source = require('./sources/source');
var Command = require('./command');
var fs = require('fs');
var fstream = require('fstream');
var wrench = require('wrench');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;


// A 'Meteor' refers to a single commit (branch, tag) of a version of the core meteor
//
// They are located on disk in ~/.meteorite/meteors.
// When you install a meteor into a project, it copies everything into
// ./.meteor/meteorite to create a 'custom' version of meteor for you to install packages into.
Meteor = function(config) {
  // Config defaults
  config = config || {};
  this.defaultMeteor = (! _.include(_.keys(config), 'git'));
  
  if (this.defaultMeteor) {
    this.prepared = true
  } else {
    config.git = config.git || 'https://github.com/meteor/meteor.git';
    config.keepGitDir = true;

    // Prepare source
    var root = Meteor.installRoot();
  
    this.source = Source.prepare(root, config);
    
    // TODO -- this is a bit coarse. but it avoids multiple installs for now
    this.prepared = fs.existsSync(this.source.path);
  }
};

// download the repo + install dev_bundle
Meteor.prototype.prepare = function(buildDevBundle, fn) {
  var self = this;
  
  if (_.isFunction(buildDevBundle))
    fn = buildDevBundle;
  
  // no need to do anything
  if (self.defaultMeteor)
    return fn();
  
  self.source.fetch(function() {
    self.install(buildDevBundle, fn);
  }, 'Meteor');
};

Meteor.prototype.install = function(buildDevBundle, fn) {
  var self = this;
  
  if (_.isFunction(buildDevBundle))
    fn = buildDevBundle;
  
  self.prepared = true;
  
  // ensure the dev_bundle is installed.
  var dev_bundle = path.join(self.source.path, 'dev_bundle');

  if (!fs.existsSync(dev_bundle)) {
    
    if (buildDevBundle) {
      console.log('Building Meteor development bundle');
      var generate = spawn('./scripts/generate-dev-bundle.sh', [], {cwd: self.source.path});
      
      generate.stdout.pipe(process.stdout);
      generate.stderr.pipe(process.stderr);
      generate.on('exit', fn);
      
    } else {
      // meteor --help installs the dev bundle before doing anything else
      console.log('Downloading Meteor development bundle');
      var meteor = spawn('./meteor', ['--help'], {cwd: self.source.path});

      // just output the status bar
      meteor.stderr.pipe(process.stderr);
      meteor.on('exit', fn);
    }
  } else {
    fn();
  }
};

// check that the above has happened
Meteor.prototype.ensurePrepared = function(fn) {
  if (this.prepared) {
    fn();
  } else {
    this.prepare(fn);
  }
};

Meteor.prototype._executable = function() {
  var self = this;
  
  if (self.defaultMeteor) {
    return 'meteor';
  } else {
    return path.join(self.source.packagePath(), 'meteor');
  }
}

// run a command using just this checked-out version of meteor
Meteor.prototype.execute = function(args, package_dir, fn) {
  var self = this;
  
  if (_.isFunction(package_dir)) {
    fn = package_dir;
    package_dir = null;
  }
  
  self.ensurePrepared(function() {
    Command.spawn(self._executable(), args, package_dir, fn);
  });
};

Meteor.prototype.isUsing = function(packageName, fn) {
  var self = this;
  
  Command.exec(self._executable(), ['list', '--using'], function(error, packages) {
    var packageNames = packages.split('\n');
    
    var regExp = new RegExp('^\w*' + packageName + '\w*$');
    fn(_.any(packageNames, function(pn) { return regExp.exec(pn); }));
  });
}

Meteor.prototype.hasPackage = function(pkgName, fn) {
  var self = this;
  
  if (self.defaultMeteor) {
    var checker = function(names) {
      fn(_.any(names, function(n) { return n === pkgName}))
    }
    
    if (!self.packageNames) {
      // we have to call meteor list because there's no obvious place to look
      exec('meteor list', function(error, list) {
        var lines = list.split('\n');
      
        self.packageNames = _.map(lines, function(l) {
          return l.split(' ')[0]
        }).filter(function(n) { return n !== ''; });
        
        checker(self.packageNames);
      });
    } else {
      checker(self.packageNames);
    }
  } else {
    self.prepare(function() {
      fn(fs.existsSync(path.join(self.source.path, 'packages', pkgName)));
    });
  }
}

Meteor.prototype.toJson = function(lock) {
  if (this.defaultMeteor) {
    return {};
  } else {
    return this.source.toJson(lock);
  }
};

Meteor.prototype.equals = function(otherMeteor) {
  if (this.defaultMeteor)
    return otherMeteor.defaultMeteor;
  
  return !otherMeteor.defaultMeteor && this.source.equals(otherMeteor.source);
};

Meteor.installRoot = function() {
  return path.join(Meteorite.root(), 'meteors');
};

module.exports = Meteor;
