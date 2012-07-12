var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var wrench = require('wrench');
var _ = require('underscore');
var Meteorite = require('../../lib/meteorite');

var verbose = false;

// delete all data and fake out ENV vars
var prepare = function(fn) {
  process.env.PATH = [path.resolve(path.join('spec', 'support', 'bin')), process.env.PATH].join(':');
  process.env.HOME = [path.resolve(path.join('spec', 'support', 'home'))];
  
  cleanup(fn);
};

// delete all data from
//  1. the fake home dir
//  2. the meteorite directories of each app
//  3. the new_apps directory
var cleanup = function(fn) {
  // 1.
  var root = Meteorite.root();
  if (path.existsSync(root))
    wrench.rmdirSyncRecursive(root);
  
  // 2.
  // TODO
  
  // 3. delete and recreate
  var new_apps = path.resolve(path.join('spec', 'support', 'apps', 'new_apps'));
  if (path.existsSync(new_apps))
    wrench.rmdirSyncRecursive(new_apps);
  fs.mkdirSync(new_apps);
  
  fn();
}

var killProcessFamily = function(grandparentId, fn) {
  var pids = [grandparentId];

  var getChildPidsFromRawPidData = function(parentPid, output) {
    var children = [];
    _.each(output.split('\n'), function(rawPs) {
      var psParts = rawPs.trim().split(/\s+/);
      var currentPid = parseInt(psParts[0]);
      var currentParentPid = parseInt(psParts[1]);
      if (currentParentPid === parentPid) {
        children.push(currentPid);
        children = _.uniq(children);
      }
    });
    return children;
  };

  var getChildPidsFor = function(pid, done) {
    var ps = spawn('ps', ['-opid', '-oppid']);
    
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
  
  getChildPidsFor(grandparentId, function() {
    _.each(pids, function(pid) {
      try {
        process.kill(pid);
      } catch(e) {}
    });

    setTimeout(fn, 0);
  });
};

var port = 7777;
var invoke = function(command, directory, options, fn) {
  directory = path.resolve(path.join('spec', 'support', 'apps', directory));
  var args = command.split(' ');
  
  if (_.first(args) === 'run') {
    args.push('--port=' + port);
    port = port + 10;
  }

  var mrt = spawn('mrt', args, { cwd: directory });

  mrt.stderr.pipe(process.stderr);
  if (verbose) mrt.stdout.pipe(process.stdout);

  var searchStrings = _.isArray(options.waitForOutput) ? _.clone(options.waitForOutput) : [options.waitForOutput];
  
  var output = '', matched = false;
  var processOutput = function(data) {
    
    output = output + data.toString();
    if (!matched &&matchesOutput(output)) {
      matched = true;
      killProcessFamily(mrt.pid, fn);
    }
  }
  
  var matchesOutput = function(output) {
    
    _.each(_.clone(searchStrings), function(searchString) {
      if (output.indexOf(searchString) >= 0)
        searchStrings.shift();
    });

    if (searchStrings.length === 0)
      return true;

  };

  mrt.stdout.on('data', processOutput);
  mrt.stderr.on('data', processOutput);
};

var getSystemInfo = function(fn) {
  var uname = spawn('uname', []);

  var unameOutput = '';
  uname.stdout.on('data', function(data) {
    unameOutput = unameOutput + data.toString().trim();
  });

  uname.on('exit', function() {
    if (unameOutput === 'Darwin')
      return fn('Darwin', 'x86_64');

    var archOutput = '';
    var arch = spawn('uname', ['-m'], function() {});
    arch.stdout.on('data', function(data) {
      archOutput = archOutput + data.toString().trim();
    });
    arch.on('exit', function() {
      fn(unameOutput, archOutput);
    });
  });
};

var getDevBundleFileName = function(fn) {
  mrt.getSystemInfo(function(uname, arch) {
    fn('dev_bundle_' + uname + '_' + arch + '_0.1.5.tar.gz');
  });
};

exports.prepare = prepare;
exports.cleanup = cleanup;
exports.invoke = invoke;
exports.getSystemInfo = getSystemInfo;
