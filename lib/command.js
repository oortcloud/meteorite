var spawn = require('child_process').spawn;

// Just some utilities to `run` meteor commands
Command = {
  execute: function(meteor_exec, args, fn) {
    var meteor = spawn(meteor_exec, args, {customFds: [0,1,2]});
    meteor.on('exit', fn);
  }
};

module.exports = Command;
