#!/usr/bin/env node

var Installer = require('../lib/installer');
var Runner = require('../lib/runner');
var argv = require('optimist').argv;

var showUsage = function() {
  console.log('show usage');
  process.exit();
};

var installer = function() {
  return new Installer().run(function() {
    console.log('Installation complete!');
  });
};

var runner = function() {
  return new Runner().run(function() {
    console.log('Running meteor!');
  });
};

var showHome = function() {
};

var command = argv._[0] || 'run';

switch(command) {

  case 'run':
    installer();
    runner();
    break;

  case 'install':
    installer();
    break;

  case 'home':
    showHome();
    break;

  default:
    showUsage();
}
