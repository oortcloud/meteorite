var spawn = require('child_process').spawn;
var path = require('path');

// Just some utilities to `run` meteor commands
Command = {
  execute: function(meteor_exec, args, fn) {
    if (!path.existsSync(meteor_exec)) {
      throw "Can't execute command: meteor executable " + meteor_exec + " does not exist";
    }
    
    var meteor = spawn(meteor_exec, args, {customFds: [0,1,2]});
    meteor.on('exit', fn);
    fn();
  }
};

module.exports = Command;
