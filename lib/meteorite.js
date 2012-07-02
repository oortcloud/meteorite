var path = require('path');
var Project = require('../lib/project');
var fs = require('fs');
var _ = require('underscore');
var wrench = require('wrench');

Meteorite = function(args) {
  // Make directories we'll need
  Meteorite.prepareFS();
  
  this.args = args;
  this.appName = this.args._[1];
  this.project = new Project();
  this.defaultSmartJson = { packages: {} };
  this.appPath = path.join(process.cwd(), this.appName);
  this.smartJsonPath = path.join(this.appPath, 'smart.json');
};

Meteorite.prototype.start = function(fn) {
  
  // Run user's subcommand
  var subCommand = this.args._[0] || 'run';
  this[subCommand](fn);

};

///////// Global meteorite commands that don't operate WRT to the current project

Meteorite.prototype.uninstall_meteorite = function(fn) {
  // TODO prompt for comfirmation
  console.log('Deleting ~/.metorite. Note that previously installed projects will no longer work...');
  
  var root = Meteorite.root();
  if (path.existsSync(root))
    wrench.rmdirSyncRecursive(root);
};

// Meteorite command
Meteorite.prototype.create = function(fn) {
  var self = this;

  // Make sure we have an app
  if (this.appName) {

    this.project.execute(this.args._, function() {

      // New project needs a new smart json file
      self._installDefaultSmartJson(fn);
      
      // TODO -- do we want to run project.install too?
    });
    
  }
};

/////// Package level meteorite commands

Meteorite.prototype.install = function(fn) {
  this.project.install(fn);
};

Meteorite.prototype.uninstall = function(fn) {
  this.project.uninstall(fn);
};

var commands = [
  'run',
  'add',
  'remove',
  'list',
  'bundle',
  'mongo',
  'deploy',
  'logs',
  'reset'
];

// Meteor commands, will get run either by the project install or the default meteor
// FIXME -- 'update'?
// TODO -- treat add, remove, list specially
_.each(commands, function(command) {
  Meteorite.prototype[command] = function(fn) {
    this.project.execute(this.args._, fn);
  };
});

Meteorite.prototype._installDefaultSmartJson = function(fn) {

  // Don't do it if there's already one
  if (path.existsSync(this.smartJsonPath))
    return fn();

  // Make a nicely formated default json string
  var smartJsonString = JSON.stringify(this.defaultSmartJson, null, 2) + "\n";

  // Install it into new project
  fs.writeFile(this.smartJsonPath, smartJsonString, function(err) {
    if (err) {
      console.log("Error: could not create smart.json", err);
      fn();
    } else {
      fn();
    }
  });

};

// Class methods

Meteorite.root = function() {
  var homeDir = process.env.HOME;
  return path.join(homeDir, '.meteorite');
};

// Creates the path to ~/.meteorite
Meteorite.prepareFS = function() {
  var root = Meteorite.root();
  if (!path.existsSync(root))
    fs.mkdir(root);
};

module.exports = Meteorite;
