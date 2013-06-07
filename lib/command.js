var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var _ = require('underscore');

// Just some utilities to `run` meteor commands
Command = {
  // execute a command and print it's output to the screen
  spawn: function(meteorExec, args, package_dir, fn) {
    var options = {customFds: [0,1,2]};
    if (package_dir) {
      options.env = _.extend({PACKAGE_DIRS: package_dir}, process.env);
    }
    
    spawn(meteorExec, args, options).on('exit', fn);
  },
  
  // execute a command and return it's output to fn
  exec: function(meteorExec, args, fn) {
    args.unshift(meteorExec);
    var command = args.join(' ');
    exec(command, fn);
  }
};

module.exports = Command;
