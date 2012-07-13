var spawn = require('child_process').spawn;
var path = require('path');

// Just some utilities to `run` meteor commands
Command = {
  execute: function(meteorExec, args, fn) {
    if (!path.existsSync(meteorExec)) {
      throw "Can't execute command: meteor executable " + meteorExec + " does not exist";
    }
    
    spawn(meteorExec, args, {customFds: [0,1,2]});
    fn();
  }
};

module.exports = Command;
