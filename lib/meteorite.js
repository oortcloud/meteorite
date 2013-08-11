var path = require('path');
var Project = require('../lib/project');
var Atmosphere = require('../lib/atmosphere');
var fs = require('fs');
var _ = require('underscore');
var wrench = require('wrench');

Meteorite = function(args, meteorArgs) {
  this.args = args;
  this.meteorArgs = meteorArgs;

  // Make directories we'll need
  Meteorite.prepareFS();
  
  this.project = new Project(process.cwd(), args);
};

///////// Global meteorite commands that don't operate WRT to the current project

// Meteorite command
Meteorite.prototype.create = function(fn) {
  var self = this;
  
  // in this case the project's root is _not_ process.cwd
  var appName = this.args._[1] || this.args.example;
  
  if (!appName)
    throw 'No name provided to mrt create!';
  
  // if you specify a path to create, you mean relative to CWD, NOT project root.
  if (this.args.path)
    this.args.path = path.resolve(process.cwd(), this.args.path);

  self.project = new Project(path.join(process.cwd(), appName), this.args);
  self.project.meteor.execute(this.meteorArgs, function() {

    // New project needs a new smart json file
    self.project.writeSmartJson();
    fn();

  });
};

Meteorite.prototype['create-package'] = function(fn) {
  var self = this;
  
  var packageDir = this.args._[1]
  var packageName = path.basename(packageDir);
  
  console.log("Creating package named " + packageName + " in " + packageDir);
  
  var packageFile = packageName + '.js';
  var testFile = packageName + '_tests.js';
  
  wrench.mkdirSyncRecursive(packageDir);
  
  // write package.js
  fs.writeFileSync(path.join(packageDir, 'package.js'),
    'Package.describe({\n' +
    '  summary: "/* fill me in */"\n' +
    '});\n\n' + 
    'Package.on_use(function (api, where) {\n' +
    '  api.add_files(\'' + packageFile + '\', [\'client\', \'server\']);\n' + 
    '});\n\n' +
    'Package.on_test(function (api) {\n' +
    '  api.use(\'' + packageName + '\');\n\n' +
    '  api.add_files(\'' + testFile + '\', [\'client\', \'server\']);\n' +
    '});\n' 
  );
  
  // touch relevant files
  fs.writeFileSync(path.join(packageDir, packageFile), '');
  fs.writeFileSync(path.join(packageDir, testFile), '');
  
  // write simple smart.json
  fs.writeFileSync(path.join(packageDir, 'smart.json'), JSON.stringify({
    "name": packageName,
    "description": "",
    "homepage": "",
    "author": "",
    "version": "0.0.1",
    "git": "",
    "packages": {}
  }, null, 2));
}

// XXX: this should probably track this (so further calls to mrt install
// don't overwrite it), or else mrt install shouldn't remove symlinks by default
Meteorite.prototype['link-package'] = function(fn) {
  var self = this;
  
  var packageDir = this.args._[1];
  var packageName = path.basename(packageDir);
  var packagePath = 'packages/' + packageName;
  
  console.log("Linking package named " + packageName + " to " + packageDir);
  
  var old;
  try { old = fs.readlinkSync(packagePath); } catch (err) {}
  
  // already done
  if (old && old === packageDir)
    return;
  
  // pointing to the wrong spot
  if (old)
    fs.unlinkSync(packagePath);
  
  fs.symlinkSync(packageDir, packagePath);
}

/////// Package level meteorite commands

Meteorite.prototype.install = function(fn) {
  this.project.install(fn);
};

Meteorite.prototype.update = function(fn) {
  this.project.update(fn);
};

Meteorite.prototype.publish = function(fn) {
  Atmosphere.publish(fn);
};

Meteorite.prototype.release = function(fn) {
  Atmosphere.release(fn);
};

Meteorite.prototype.uninstall = function(fn) {
  if (this.args.system)
    Meteorite.uninstall();
  else
    this.project.uninstall(fn);
};

// if the package isn't in meteor's list, add it to smart.json
Meteorite.prototype.add = function(fn) {
  var self = this;
  var packageName = this.meteorArgs[1];
  
  var version = this.args['pkg-version'];
  
  // TODO: resolve the complexity of supporting more than one package being added at once
  // for now we just spit out an error
  if (this.args._.length > 2)
    console.log("NOTE: mrt add only supports adding a single package at a time, truncating.");
  
  // ensure we have the package
  self.project.installPackage(packageName, version, function() {
    
    // OK. We've "meteorite" installed it (i.e. put it in packages/)
    // now we just need to test if this means Meteor thinks it's installed,
    // or if we need to `meteor add` it too.
    
    // XXX: at some future point when we no longer have to do this, remove.
    self.project.isUsing(packageName, function(success) {
      if (!success) {
        self.project.execute(['add', packageName], fn);
      } else {
        fn();
      }
    });
  });
};

// Meteor commands, will get run either by the project install or the default meteor
// FIXME -- 'update'?
// TODO -- treat add, remove, list specially
_.each([
  'run',
  'help',
  'remove',
  'list',
  'bundle',
  'mongo',
  'deploy',
  'logs',
  'reset',
  'test-packages'
], function(command) {
  Meteorite.prototype[command] = function(fn) {
    this.project.execute(this.meteorArgs, fn);
  };
});

// Class methods

Meteorite.root = function() {
  var homeDir = process.env.HOME;
  return path.join(homeDir, '.meteorite');
};

// Creates the path to ~/.meteorite
Meteorite.prepareFS = function() {
  var root = Meteorite.root();
  if (!fs.existsSync(root))
    fs.mkdirSync(root);
};

// Uninstall everything from ~/.meteorite
Meteorite.uninstall = function() {
  // TODO prompt for confirmation
  console.log('Deleting ~/.meteorite. Note that previously installed projects will no longer work');
  
  var root = Meteorite.root();
  if (fs.existsSync(root)) 
    wrench.rmdirSyncRecursive(root);    
};

module.exports = Meteorite;

// var _debug = require('./debug');
// _.debugClass('Meteorite');
