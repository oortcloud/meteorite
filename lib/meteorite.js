var path = require('path');
var Project = require('../lib/project');
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
  var appName = this.args._[1];
  
  //if (!appName)
    // TODO raise something
  
  self.project = new Project(path.join(process.cwd(), appName), this.args);
  
  self.project.execute(this.meteorArgs, function() {
    
    // New project needs a new smart json file
    self.project.writeSmartJson(fn);
    
    // TODO -- do we want to run project.install too?
  });
};

/////// Package level meteorite commands

Meteorite.prototype.install = function(fn) {
  this.project.install(fn);
};

// TODO does this get called?
Meteorite.prototype.uninstall = function(fn) {
  if (this.args.system) {
    Meteorite.uninstall()
  } else {
    this.project.uninstall(fn);
  }
};

var commands = [
  'run',
  'add',
  'help',
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
  if (!path.existsSync(root))
    fs.mkdir(root);
};

// Uninstall everything from ~/.meteorite
Meteorite.uninstall = function() {
  // TODO prompt for confirmation
  console.log('Deleting ~/.meteorite. Note that previously installed projects will no longer work...');
  
  var root = Meteorite.root();
  if (path.existsSync(root)) 
    wrench.rmdirSyncRecursive(root);    
}

module.exports = Meteorite;
