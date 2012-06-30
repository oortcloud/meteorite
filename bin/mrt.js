#!/usr/bin/env node

var Project = require('../lib/project');
var argv = require('optimist').argv;
var path = require('path');
var fs = require('fs');

// Figure out which command the user is 
// running, user 'run' if none specified
var command = argv._[0] || 'run';

if (command === 'uninstall') {

  // Uninstall project
  new Project().uninstall();

} else if (command === 'create') {

  // What's the name of the new app?
  var appName = argv._[1];

  // Get ready for `meteor create` by checking out
  // a copy of meteor
  // TODO allow specifying fork/branch/tag/ref/etc
  if (appName)
    new Meteor({ branch: 'master' }).repo.fetch(function() {});

} else if (command === 'post_create') {

  // Figure out paths
  var appName = argv._[2];
  var appPath = path.join(process.cwd(), appName);
  var smartJsonPath = path.join(appPath, 'smart.json');

  // Make a default smart.json for the new project
  var defaultSmartJson = {packages: {}};
  var smartJsonString = JSON.stringify(defaultSmartJson, null, 2) + "\n";
  fs.writeFile(smartJsonPath, smartJsonString, function(err) {
    if(err) {
      console.log("Error: could not create smart.json", err);
    }
  });

  // Output path to new project, used by `mrt.js`
  console.log(appPath);

} else {

  // Just install the project, nothing else!
  new Project().install(function() {});

}
