#!/usr/bin/env node

var Project = require('../lib/project');
var argv = require('optimist').argv;
var path = require('path');

var command = argv._[0] || 'run';

if (command === 'home' || (!argv.verbose && !argv.v)) {
  console.info = function() {};
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

    case 'command':
      var args = process.argv.slice(3);
      console.log(path.join(this.meteor.installRoot, 'meteor'), args.join(' '));
      break;

    default:
      process.exit();

  }

});
