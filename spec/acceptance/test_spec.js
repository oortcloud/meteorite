var packagesNeeded = {
  'mrt-test-pkg1': ['0.1.0', '0.2.0'],
  'mrt-test-pkg2': ['0.1.0']
}

var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var wrench = require('wrench');
var utils = require('../lib/utils.js');
var _ = require('underscore');
var async = require('async');
var ddp = require('ddp');

// this is our home dir for running mrt against
var appHome = utils.appHome;

// this is where the app we are testing will live
var appDir = path.join(appHome, 'app');

before(function(done){
  // ensure our "cached" CURL is in the path
  process.env.PATH = [path.resolve(path.join('spec', 'support', 'bin')), process.env.PATH].join(':');
  
  // make sure Meteor doesn't try to install into our soon to be clean home dir
  process.env.METEOR_WAREHOUSE_DIR = path.join(process.env.HOME, '.meteor');
  
  // set our home dir so we can easily blow away meteorite installs
  process.env.HOME = appHome;
  
  console.log("Preparing..")
  // ensure we have the latest dev bundle cached
  console.log("  Ensuring we have the dev bundle for system meteor");
  utils.downloadDevBundle('meteor', function() {
    // ensure we have dev bundles for all our meteor forks
    // XXX:
    // for meteor in meteors/
    //   run meteor/meteor --help
  
    console.log("  Ensuring local atmosphere is running with the right packages");
    loadAtmosphere(done);
  });
});


beforeEach(function() {
  // clear out the fake home directory
  if (fs.existsSync(appHome))
    wrench.rmdirSyncRecursive(appHome);
  fs.mkdirSync(appHome);
});


var loadAtmosphere = function(done) {
  var tasks = []
  
  _.each(packagesNeeded, function(versions, name) {
    _.each(versions, function(version) {
      var packageDir = path.join(utils.packagesDir, name);
      tasks.push(function(next) {
        // console.log(packageDir, version);
        exec('git checkout v' + version, {cwd: packageDir}, function(err) {
          if (err) {
            return done("Problem checking out package version" + err);
          }
          exec('printf "test\ntesttest\n" | mrt publish . --repoHost localhost --repoPort 3333', function() {
            if (err) {
              return done("Problem checking publishing package" + err);
            }
            
            next();
          });
        });
      });
    });
  });
  
 tasks.push(function() { 
    done();
  });
  
  async.series(tasks);
}