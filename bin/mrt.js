#!/usr/bin/env node

var Meteorite = require('../lib/meteorite');
var args = require('optimist').argv;

// Figure out which subcommand the user is 
// running, use 'run' if none specified
var subCommandName = args._[0] || 'run';

// Build a Meteorite instance
var meteorite = new Meteorite();

// Get the user's subcommand
var subCommand = meteorite[subCommandName];

// Run it!
subCommand.call(meteorite, function() {});
