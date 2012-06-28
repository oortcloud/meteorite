#!/usr/bin/env node

var Project = require('../lib/project');
var Runner = require('../lib/runner');
var argv = require('optimist').argv;

var showUsage = function() {
  process.exit();
};

var showHome = function() {
};

var command = argv._[0] || 'run';

switch(command) {

  case 'run':
    var project = new Project();
    project.run(function() {
      console.log('Project running!');
    });
    break;

  case 'install':
    var project = new Project();
    project.install(function() {
      console.log('Project installed!');
    });
    break;

  case 'home':
    showHome();
    break;

  default:
    showUsage();
}
