var spawn = require('child_process').spawn;

// Just some utilities to `run` meteor commands
Command = {
  execute: function(meteor_exec, args, fn) {
    var meteor = spawn(meteor_exec, args, {customFds: [0,1,2]});
    
    global._pids = global._pids || [];
    global._pids.push(meteor.pid);
    console.log('command', meteor.pid);
    meteor.on('exit', fn);
    fn();
  }
};

module.exports = Command;
