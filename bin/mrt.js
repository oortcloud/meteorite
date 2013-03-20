#!/usr/bin/env node

var _ = require('underscore');
var meteoriteArgs = require('optimist').argv;
var Meteorite = require('../lib/meteorite');
var fs = require('../lib/utils/fs');
var _console = require('../lib/console');

// Figure out which subcommand the user is 
// running, use 'run' if none specified
var subCommandName = meteoriteArgs._[0] || 'run';

// Build a Meteorite instance
var meteorArgs = process.argv.slice(2);
var meteorite = new Meteorite(meteoriteArgs, meteorArgs);

if (meteoriteArgs.version)
  console.log('Meteorite version ' + require('../package').version);

if (!meteorite[subCommandName])
  throw("Subcommand " + subCommandName + " does not exist!");

// Run user's subcommand
meteorite[subCommandName](function() {
  // TODO Annoying, why do we have to do this?
  // Shouldn't the app terminate naturally?
  process.exit();
});
