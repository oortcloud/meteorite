var path = require('path');
var Project = require('../lib/project');
var fs = require('fs');
var _ = require('underscore');
var args = require('optimist').argv;

Meteorite = function() {
  this.project = new Project();
  this.defaultSmartJson = { packages: {} };
  this.appPath = path.join(process.cwd(), this.appName);
  this.smartJsonPath = path.join(this.appPath, 'smart.json');
};

Meteorite.prototype.run = function(fn) {
  var self = this;

  if (!self.hasSmartJson())
    return self.project.meteor.run(fn);

  self.project.install(function() {
    self.project.meteor.run(fn);
  });
};

Meteorite.prototype.create = function(fn) {
  var self = this;

  // What's the name of the new app?
  this.appName = args._[1];
  if (this.appName) {
    
    // Get ready for `meteor create` by checking out
    // a copy of meteor
    // TODO allow specifying fork/branch/tag/ref/etc
    var meteor = new Meteor({ branch: 'master' });

    // Get meteor ready before we create the new project
    meteor.prepare(function() {
      
      // Coast is clear, do it!
      meteor.create(function() {
  
        // TODO copy the dev bundle over or something here
        // so when we add run the new project for the first
        // time it doesn't need to be refetched

        // New project needs a new smart json file
        self.installDefaultSmartJson(fn);

      });
    });
  }

};

Meteorite.prototype.install = function(fn) {
  this.project.install(fn);
};

Meteorite.prototype.uninstall = function(fn) {
  this.project.uninstall(fn);
};

Meteorite.prototype.hasSmartJson = function() {
  return path.existsSync(this.smartJsonPath);
};

Meteorite.prototype.installDefaultSmartJson = function(fn) {

  if (this.hasSmartJson())
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
