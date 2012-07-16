var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('../../lib/utils/fs');
var wrench = require('wrench');
var _ = require('underscore');
var assert = require('assert');
var Meteorite = require('../../lib/meteorite');

// is this the wrong way to do it?
var verbose = require('optimist').argv.verbose;

// delete all data and fake out ENV vars
var prepare = function(fn) {
  process.env.PATH = [path.resolve(path.join('spec', 'support', 'bin')), process.env.PATH].join(':');
  process.env.HOME = [path.resolve(path.join('spec', 'support', 'home'))];
  
  cleanup(fn);
};

var clearTestFiles = function() {
  var appsPath = path.resolve(path.join('spec', 'support', 'apps'));
  var apps = fs.readdirSync(appsPath);
  _.each(apps, function(app) {
    var appPath = path.join(appsPath, app);

    var meteoritePath = path.join(appPath, '.meteor', 'meteorite'); 
    if (fs.existsSync(meteoritePath))
      wrench.rmdirSyncRecursive(meteoritePath);

    var smartJsonPath = path.join(appPath, 'smart.lock');
    if (fs.existsSync(smartJsonPath))
      fs.unlinkSync(smartJsonPath);

  });
};

// delete all data from
//  1. the fake home dir
//  2. the meteorite directories and smart.lock of each app
//  3. the new_apps directory
var cleanup = function(fn) {
  // 1.
  var root = Meteorite.root();
  if (fs.existsSync(root))
    wrench.rmdirSyncRecursive(root);
  
  // 2.
  clearTestFiles();
  
  // 3. delete and recreate
  var newApps = path.resolve(path.join('spec', 'support', 'apps', 'new_apps'));
  if (fs.existsSync(newApps))
    wrench.rmdirSyncRecursive(newApps);
  fs.mkdirSync(newApps);
  
  fn();
};

var copyLockfileToApp = function(lockName, appName) {
  var lockData = fs.readFileSync(path.join('spec', 'support', 'resources', 'smart.lock.'+lockName));
  fs.writeFileSync(path.join('spec', 'support', 'apps', appName, 'smart.lock'), lockData);
}

var killProcessFamily = function(grandparentId, fn) {
  var pids = [grandparentId];

  var getChildPidsFromRawPidData = function(parentPid, output) {
    var children = [];
    _.each(output.split('\n'), function(rawPs) {
      var psParts = rawPs.trim().split(/\s+/);
      var currentPid = parseInt(psParts[0], 10);
      var currentParentPid = parseInt(psParts[1], 10);
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

  if (verbose) mrt.stderr.pipe(process.stderr);
  if (verbose) mrt.stdout.pipe(process.stdout);

  var searchStrings, failStrings;
  
  if (options.waitForOutput)
    searchStrings = _.isArray(options.waitForOutput) ? _.clone(options.waitForOutput) : [options.waitForOutput];
  if (options.assertNoOutput)
    failStrings  = _.isArray(options.assertNoOutput) ? _.clone(options.assertNoOutput) : [options.assertNoOutput];
  
  var output = '', matched = false, failed = false;
  var processOutput = function(data) {
    
    output = output + data.toString();
    if (!matched && searchStrings && matchesOutput(output, searchStrings)) {
      matched = true;
      killProcessFamily(mrt.pid, fn);
    }
    
    if (!failed && failStrings && matchesOutput(output, failStrings)) {
      failed = true;
      killProcessFamily(mrt.pid, function() {
        assert.ok(false, 'Output incorrectly matched' + failStrings.join(','));
      });
    }
  };
  
  var matchesOutput = function(output, strings) {
    
    var i;
    // reverse search to ensure no funny buggers
    for (i = strings.length - 1; i >= 0; i--) {
      var searchString = strings[i];
      
      if (output.indexOf(searchString) >= 0)
        strings.splice(i, 1);
    }
    
    if (strings.length === 0)
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
exports.copyLockfileToApp = copyLockfileToApp;
exports.invoke = invoke;
exports.getSystemInfo = getSystemInfo;
