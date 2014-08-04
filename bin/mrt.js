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
  Atmosphere.disconnect();
  
  // no idea how it can get here and not exit but it seems to at times
  process.exit(0)
});
