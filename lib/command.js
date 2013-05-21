var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var _ = require('underscore');

// Just some utilities to `run` meteor commands
Command = {
  execute: function(meteorExec, args, fn) {
    var options = {customFds: [0,1,2]};
    spawn(meteorExec, args, options).on('exit', fn);
  }
};

module.exports = Command;
