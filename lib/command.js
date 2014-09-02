var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var children = {};
var terminating = false;

// Just some utilities to `run` meteor commands
Command = {
  // execute a command and print it's output to the screen
  spawn: function(meteorExec, args, package_dir, fn) {
    var options = {customFds: [0,1,2]};
    if (package_dir) {
      options.env = _.extend({PACKAGE_DIRS: package_dir}, process.env);
    }
    
    var child = spawn(meteorExec, args, options)
      .on('error', function(err) {
        delete children[child.pid];
        // yikes! can't find the executable!
        if (err.code === 'ENOENT') {
          if (meteorExec === 'meteor') {
            console.log("Can't find meteor executable!".red.bold);
            console.log();
            console.log("Please install meteor from http://meteor.com".red)
          } else {
            // XXX: is this possible?
            console.log(("Can't find executable at " + meteorExec).red.bold);
            console.log();
            console.log("Please run mrt uninstall --system, and try again.".red);
          }
        }
        throw "Error running a command: " + err.code;
      })
      .on('exit', function (code, signal) {
        delete children[child.pid];
        if (code || signal) {
          if (!terminating) {
            throw "Command exited with " + code + "/" + signal;
          }
        }
        else if (fn) {
          fn();
        }
      });
      children[child.pid] = child;
  },
  
  // execute a command and return it's output to fn
  exec: function(meteorExec, args, fn) {
    args.unshift(meteorExec);
    var command = args.join(' ');
    exec(command, function (error) {
      fn.apply(null, arguments);
    });
  }
};

function cleanup(sig) {
  _.each(children, function (child, pid) {
    child.kill(sig);
  });
}

process.on('exit', function () {
  cleanup('SIGTERM');
});
_.each(['SIGINT', 'SIGHUP', 'SIGTERM'], function (sig) {
  process.once(sig, function () {
    terminating = true;
    cleanup(sig);
  });
});

module.exports = Command;
