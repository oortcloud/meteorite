#!/usr/bin/env node

var Project = require('../lib/project');
var argv = require('optimist').argv;
var path = require('path');

var command = argv._[0] || 'run';

if (command === 'uninstall') {
  new Project().uninstall();
  return;
}

new Project().install(function() {

  switch(command) {

    case 'run':
      console.log('Running app!');
      break;

    case 'install':
      console.log('Installed app!');
      break;

    case 'home':
      console.log(this.meteor.installRoot);
      break;

    default:
      process.exit();

  }

});
