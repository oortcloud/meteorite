var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var _ = require('underscore');

// Just some utilities to `run` meteor commands
Command = {
  execute: function(meteorExec, args, package_dir, fn) {
    var options = {customFds: [0,1,2]};
    if (package_dir) {
      options.env = _.extend({PACKAGE_DIRS: package_dir}, process.env);
    } else {
      fn = package_dir;
    }
      
    
    spawn(meteorExec, args, options).on('exit', fn);
  }
};

module.exports = Command;
