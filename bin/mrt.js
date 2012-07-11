#!/usr/bin/env node

var _ = require('underscore');
var meteoriteArgs = require('optimist').argv;
var Meteorite = require('../lib/meteorite');

// Figure out which subcommand the user is 
// running, use 'run' if none specified
var subCommandName = meteoriteArgs._[0] || 'run';

// Build a Meteorite instance
var meteorArgs = process.argv.slice(2);
var meteorite = new Meteorite(meteoriteArgs, meteorArgs);

// Run user's subcommand
meteorite[subCommandName](_.identity);
