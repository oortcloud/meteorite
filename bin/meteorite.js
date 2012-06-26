#!/usr/bin/env node

var Project = require('../lib/project');
var Runner = require('../lib/runner');
var argv = require('optimist').argv;

var showUsage = function() {
  console.log('show usage');
  process.exit();
};

var showHome = function() {
};

var command = argv._[0] || 'run';

switch(command) {

  case 'run':
    project = new Project().run(function() {
      console.log('Project running!');
    });
    break;

  case 'install':
    project = new Project().install(function() {
      console.log('Project installed!');
    });
    break;

  case 'home':
    showHome();
    break;

  default:
    showUsage();
}
