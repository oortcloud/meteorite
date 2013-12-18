// run mrt against a certain app and wait for given output

var path = require('path');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
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
  // we need to grab a table of process ids and parent ids to form a tree out of
  exec('ps -opid -oppid', function(err, rawData) {
    // parse the list of process ids and parent ids
    var processes = _.map(rawData.split('\n'), function(line) {
      return line.trim().split(/\s+/);
    });
    
    var pids = ['' + child.pid];
    
    // it might not be still running so this could throw an error
    try { process.kill(child.pid); } catch (exception) { }
      
    
    // XXX: this assumes the process are "chronological". Is this true?
    _.each(processes, function(info) {
      
      // the parent of the process is in the list of parent processes
      if (_.include(pids, info[1])) {
        // this process is now a potential parent
        pids.push(info[0]);
        
        // kill the sucker;
        try { process.kill(info[0]); } catch (exception) { }
      }
    });
    
    done(error);
  });
}


var failMessage = function(message, matched, content) {
  return message + ' ' + matched + '\nACTUAL:\n' + content;
}

var spawnAndWait = function(executable, args, options, done) {
  var matched = false;
  
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
    if (matched) return;
    
    // console.error('' + data);
    output += data;
    
    if (failOn && matchesSpecs(output, failOn)) {
      matched = true;
      return killProcessFamily(mrt, failMessage('Matched', failOn, output), done);
    }
    
    if (waitFor && matchesSpecs(output, waitFor)) {
      matched = true;
      return killProcessFamily(mrt, null, done);
    }
  }
  
  mrt.stdout.on('data', processOutput);
  mrt.stderr.on('data', processOutput);
  
  mrt.on('close', function() {
    if (! matched)
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
  args.push('--port=4444');
  
  spawnAndWait(meteoriteExecutable, args, options, done);
}

var invokeMrtInApp = function(appName, args, options, done) {
  var appSourceDir = path.join(utils.appsDir, appName);
  var appDir = path.join(utils.appHome, appName);
  
  wrench.mkdirSyncRecursive(appDir);
  var reader = fstream.Reader(appSourceDir);
  var writer = fstream.Writer(appDir);
  
  writer.on('close', function() {
    if (options.withLockFile) {
      utils.copyLockfileToApp(options.withLockFile, appDir);
      delete options.withLockFile;
    }
    
    invokeMrt(appDir, args, options, done);
  });
  
  reader.pipe(writer);
}


exports.invokeMrt = invokeMrt;
exports.invokeMrtInApp = invokeMrtInApp;