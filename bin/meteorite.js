#!/usr/bin/env node

var Installer = require('../lib/installer');
var Runner = require('../lib/runner');
var argv = require('optimist').argv;

var showUsage = function() {
  console.log('show usage');
  process.exit();
};

var install = function() {
  new Installer().run(function() {
    console.log('Installation complete!');
  });
};

var run = function() {
  new Runner().run(function() {
    console.log('Running meteor!');
  });
};

var showHome = function() {
};

var command = argv._[0] || 'run';

switch(command) {

  case 'run':
    install();
    run();
    break;

  case 'install':
    install();
    break;

  case 'home':
    showHome();
    break;

  default:
    showUsage();
}
