var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var _ = require('underscore');

// Just some utilities to `run` meteor commands
Command = {
  execute: function(meteorExec, args, packages, fn) {
    if (!fs.existsSync(meteorExec))
      throw "Can't execute command: meteor executable " + meteorExec + " does not exist";
    
    var options = {customFds: [0,1,2]}; // wire up stdXs
    
    // make sure meteor knows where to look for packages
    options.env = process.env;
    options.env.PACKAGE_DIRS = _.map(packages, function(package) {
      return path.resolve(package.source.packagePath(), '..');
    }).join(':');
    
    spawn(meteorExec, args, options).on('exit', fn);
  }
};

module.exports = Command;
