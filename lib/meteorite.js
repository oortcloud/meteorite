var path = require('path');
var Project = require('../lib/project');
var fs = require('fs');
var _ = require('underscore');
var args = require('optimist').argv;

Meteorite = function() {};

Meteorite.prototype.run = function(fn) {
  var project = new Project();

  project.install(function() {
    project.meteor.run(fn);
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

        // console.log(self);
        self._initSmartJson(fn);

      });
    });
  }

};

Meteorite.prototype.install = function(fn) {
  var project = new Project();

  project.install(fn);
};

Meteorite.prototype.uninstall = function(fn) {
  var project = new Project();

  project.uninstall(fn);
};

Meteorite.prototype._initSmartJson = function(fn) {
  var appPath = path.join(process.cwd(), this.appName);
  var smartJsonPath = path.join(appPath, 'smart.json');

  // Make a default smart.json for the new project
  var defaultSmartJson = { packages: {} };
  var smartJsonString = JSON.stringify(defaultSmartJson, null, 2) + "\n";
  fs.writeFile(smartJsonPath, smartJsonString, function(err) {
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
