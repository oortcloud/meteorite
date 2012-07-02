#!/usr/bin/env node

var _ = require('underscore');
var args = require('optimist').argv;
var Meteorite = require('../lib/meteorite');

// Build a Meteorite instance
var meteorite = new Meteorite(args).start(_.identity);
