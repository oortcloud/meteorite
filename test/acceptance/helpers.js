var spawn = require('child_process').spawn;
var path = require('path');
var wrench = require('wrench');
var _ = require('underscore');
var TestServer = require('../support/http/test');
var Meteorite = require('../../lib/meteorite');

var verbose = false;

var uninstall = function(fn) {
  var root = Meteorite.root();

  if (path.existsSync(root))
    wrench.rmdirSyncRecursive(root);
    
  fn();
};

var killProcessFamily = function(patriachPid, fn) {
  var pids = [patriachPid];

  var getChildPidsFromRawPidData = function(parentPid, output) {
    var children = [];
    _.each(output.split('\n'), function(rawPs) {
      var psParts = rawPs.split(' ');
      var currentPid = parseInt(psParts[1]);
      var currentParentPid = parseInt(psParts[2]);
      if (currentParentPid === parentPid) {
        children.push(currentPid);
        children = _.uniq(children);
      }
    });
    return children;
  };

  var getChildPidsFor = function(pid, done) {
    var ps = spawn('ps', ['j']);
    
    var output = '';
    ps.stdout.on('data', function(data) {
      output = output + data.toString();
    }); 

    ps.on('exit', function() {
      var childPids = getChildPidsFromRawPidData(pid, output);
      pids.push(childPids);
      pids = _.flatten(pids);
      if (childPids.length > 0) {
        var processed = 0;
        _.each(childPids, function(childPid) {
          getChildPidsFor(childPid, function() {
            processed++;
            if (processed >= childPids.length) {
              return done();
            }
          });
        });
      } else {
        done();
      }
    });
  };
  
  getChildPidsFor(patriachPid, function() {
    _.each(pids, function(pid) {
      try {
        process.kill(pid);
      } catch(e) {}
    });
    fn();
  });
};

var port = 7777;
var invoke = function(command, directory, options, fn) {
  directory = path.resolve(path.join('test', 'support', 'apps', directory));
  var args = command.split(' ');
  
  args.push('--port=' + port);
  port = port + 10;
  
  process.env.PATH = [path.resolve(path.join('test', 'support', 'bin')), process.env.PATH].join(':')

  var mrt = spawn('mrt', args, { cwd: directory });

  if (verbose) mrt.stderr.pipe(process.stderr);
  if (verbose) mrt.stdout.pipe(process.stdout);

  var output = '';
  mrt.stdout.on('data', function(data) {
    output = output + data.toString();
      if (output.indexOf(options.expect) >= 0) {
      killProcessFamily(mrt.pid, fn);
    }
  });
};

exports.uninstall = uninstall;
exports.invoke = invoke;
