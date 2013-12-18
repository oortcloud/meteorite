// run mrt against a certain app and wait for given output

var path = require('path');
var spawn = require('child_process').spawn;
var _ = require('underscore');
var utils = require('./utils.js');
var wrench = require('wrench');
var fstream = require('fstream');

var meteoriteExecutable = path.resolve(path.join('bin', 'mrt.js'));

var matchesSpecs = function(output, specs) {
  return _.all(specs, function(spec) {
    return output.indexOf(spec) > -1;
  })
}

// kill the process family described by process, then send done the error
var killProcessFamily = function(child, error, done) {
  // find the process group
  // kill all processes with the same group
  
  process.kill(child.pid)
  done(error);
}

var failMessage = function(message, matched, content) {
  return message + ' ' + matched + '\nACTUAL:\n' + content;
}

var spawnAndWait = function(executable, args, options, done) {
  var finished = false;
  
  var waitFor = options.waitForOutput;
  if (waitFor) {
    waitFor = [].concat(waitFor);
    delete options.waitForOutput;
  }
  
  var failOn = options.failOnOutput;
  if (failOn) {
    failOn = [].concat(failOn);
    delete options.failOnOutput;
  }
  
  // run executable
  var mrt = spawn(executable, args, options);
  
  var output = '';
  var processOutput = function(data) {
    output += data;
    
    if (failOn && matchesSpecs(output, failOn)) {
      finished = true;
      return killProcessFamily(mrt, failMessage('Matched', failOn, output), done);
    }
    
    if (waitFor && matchesSpecs(output, waitFor)) {
      finished = true;
      return killProcessFamily(mrt, null, done);
    }
  }
  
  mrt.stdout.on('data', processOutput);
  mrt.stderr.on('data', processOutput);
  
  mrt.on('close', function() {
    if (! finished)
      return done(waitFor && new Error(failMessage('Failed to match', waitFor, output)));
  });
}


var invokeMrt = function(directory, args, options, done) {
  // cd into the dir
  options.cwd = directory;
  
  // point us to local atmosphere
  args.push('--verbose');
  args.push('--repoPort=3333');
  args.push('--repoHost=localhost');
  
  spawnAndWait(meteoriteExecutable, args, options, done);
}

var invokeMrtInApp = function(appName, args, options, done) {
  var appSourceDir = path.join(utils.appsDir, appName);
  var appDir = path.join(utils.appHome, appName);
  
  wrench.mkdirSyncRecursive(appDir);
  var reader = fstream.Reader(appSourceDir);
  var writer = fstream.Writer(appDir);
  
  writer.on('close', function() {
    invokeMrt(appDir, args, options, done);
  });
  
  reader.pipe(writer);
}

exports.invokeMrt = invokeMrt;
exports.invokeMrtInApp = invokeMrtInApp;