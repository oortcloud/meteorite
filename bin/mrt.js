#!/usr/bin/env node

var Project = require('../lib/project');
var argv = require('optimist').argv;
var path = require('path');
var fs = require('fs');

var command = argv._[0] || 'run';

if (command === 'uninstall') {

  new Project().uninstall();

} else if (command === 'create') {

  var appName = argv._[1];
  if (appName) {
    new Meteor({
      branch: 'master'
    }).repo.fetch(function() {});
  }

} else if (command === 'post_create') {

  var appName = argv._[2];
  var appPath = path.join(process.cwd(), appName);
  var smartJsonPath = path.join(appPath, 'smart.json');

  fs.writeFile(smartJsonPath, '{"packages": {}}', function(err) {
    if(err) {
      console.log("Error: could not create smart.json", err);
    }
  });

  console.log(appPath);

} else {

  new Project().install(function() {});

}
