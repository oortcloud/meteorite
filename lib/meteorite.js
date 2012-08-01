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

Meteorite.prototype.uninstall = function(fn) {
  if (this.args.system)
    Meteorite.uninstall();
  else
    this.project.uninstall(fn);
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
  if (!fs.existsSync(root))
    fs.mkdir(root);
};

// Uninstall everything from ~/.meteorite
Meteorite.uninstall = function() {
  // TODO prompt for confirmation
  console.log('Deleting ~/.meteorite. Note that previously installed projects will no longer work...');
  
  var root = Meteorite.root();
  if (fs.existsSync(root)) 
    wrench.rmdirSyncRecursive(root);    
};

module.exports = Meteorite;
