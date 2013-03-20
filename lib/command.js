var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var _ = require('underscore');

// Just some utilities to `run` meteor commands
Command = {
  execute: function(meteorExec, args, package_dir, fn) {
    if (!fs.existsSync(meteorExec))
      throw("Can't execute command: meteor executable " + meteorExec + " does not exist");
    
    var options = {customFds: [0,1,2]};
    if (package_dir)
      options.env = _.extend({PACKAGE_DIRS: package_dir}, process.env);
    
    spawn(meteorExec, args, options).on('exit', fn);
  }
};

module.exports = Command;
