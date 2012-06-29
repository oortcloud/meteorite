#!/usr/bin/env node

var Project = require('../lib/project');
var Runner = require('../lib/runner');
var argv = require('optimist').argv;
var path = require('path');

var showUsage = function() {
  process.exit();
};

var command = argv._[0] || 'run';

if (!argv.verbose && !argv.v)
  console.info = function() {};

var project = new Project();

switch(command) {

  case 'run':
    project.install(function() {
      console.log('Running app!');
    });
    break;

  case 'install':
    project.install(function() {
      console.log('Installed app!');
    });
    break;

  case 'home':
    project.install(function() {
      console.log(project.meteor.installRoot);
    });
    break;

  case 'command':
    project.install(function() {
      var args = process.argv.slice(3);
      console.log(path.join(project.meteor.installRoot, 'meteor'), args.join(' '));
    });
    break;

  default:
    showUsage();
}
