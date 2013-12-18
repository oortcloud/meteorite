// basic filesystem utils for our tests
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var appHome = path.resolve(path.join('spec', 'var', 'home'));
var appsDir = path.resolve(path.join('spec', 'support', 'apps'));
var packagesDir = path.resolve(path.join('spec', 'support', 'packages'));

// ensure that we've cached the executable for a given version of Metoer
// (right now all this does is run `X --help`)
var downloadDevBundle = function(meteorExecutable, done) {
  var meteor = spawn(meteorExecutable, ['--help']);
  
  //meteor.stdout.on('data', function(d) {console.error('' + d);})
  
  meteor.stderr.on('data', function(data) {
    console.log('' +data);
    // janky node way of testing for missing executable
    if (/^execvp\(\)/.test(data)) {
      done("Meteor executable not found. Make sure you've installed " + meteorExecutable)
    }
  });
  
  meteor.on('close', function(code) {
    // not sure why, but meteor --help returns 1
    if (code !== 1) return done('Downloading dev bundle failed');
    
    done();
  });
}

// apply callback to each file in baseDir. 
// 
// callback is assumed to have the format fn(filename, done)
var forEachDir = function(baseDir, callback, done) {
  var files = fs.readdirSync(baseDir);
  
  var walk = function(i) {
    if (i === files.length)
      return done();
    
    callback(path.join(baseDir, files[i]), function() {
      walk(i+1);
    });
  }
  
  walk(0);
}

var forEachPackage = function(callback, done) {
  forEachDir(packagesDir, callback, done);
}

var copyLockfileToApp = function(lockName, appDir) {
  var lockData = fs.readFileSync(path.join('spec', 'support', 'resources', 'smart.lock.'+lockName));
  fs.writeFileSync(path.join(appDir, 'smart.lock'), lockData);
};


exports.appHome = appHome;
exports.appsDir = appsDir;
exports.packagesDir = packagesDir;
exports.forEachPackage = forEachPackage;
exports.downloadDevBundle = downloadDevBundle;
exports.copyLockfileToApp = copyLockfileToApp;