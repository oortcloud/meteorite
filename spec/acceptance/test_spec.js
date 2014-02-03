var path = require('path');
var fs = require('fs');
var wrench = require('wrench');
var _ = require('underscore');
var ddp = require('ddp');
var which = require('which');

var utils = require('../lib/utils.js');
var env = require('../../lib/utils/env.js');
var atmosphere = require('../lib/atmosphere.js');

// this is our home dir for running mrt against
var appHome = utils.appHome;

// this is where the app we are testing will live
var appDir = path.join(appHome, 'app');

before(function(done){
  // ensure our "cached" git is in the path
  process.env._METEORITE_REAL_GIT = which.sync('git');
  process.env._METEORITE_REAL_METEOR = path.basename(which.sync('meteor'));
  process.env.PATH = [path.resolve(path.join('spec', 'support', 'bin')), process.env.PATH].join(path.delimiter);

  if (!process.env.METEOR_WAREHOUSE_DIR) {
    // make sure Meteor doesn't try to install into our soon to be clean home dir
    process.env.METEOR_WAREHOUSE_DIR = env.buildFromHomePath('.meteor');
  }
  
  // set our home dir so we can easily blow away meteorite installs
  wrench.mkdirSyncRecursive(appHome);
  process.env.HOME = appHome;
  process.env.LOCALAPPDATA = appHome;
  
  console.log("Preparing..")
  // ensure we have the latest dev bundle cached
  console.log("  Ensuring we have the dev bundle for system meteor");
  utils.downloadDevBundle(process.env._METEORITE_REAL_METEOR, function() {
    // ensure we have dev bundles for all our meteor forks
    // XXX:
    // for meteor in meteors/
    //   run meteor/meteor --help
  
    console.log("  Ensuring local atmosphere is running with the right packages");
    atmosphere.loadPackages(done);
  });
});


beforeEach(function() {
  // clear out the fake home directory
  if (fs.existsSync(appHome)) {
    // XXX: this is really nasty but it appears some process is not releasing 
    // files in time so sometimes this call fails with ENOTEMPTY:
    //
    //   https://github.com/oortcloud/meteorite/issues/235
    //
    // Retrying a couple of times seems to work.  Real solution is to figure
    // out why process isn't being killed.
    try {
      wrench.rmdirSyncRecursive(appHome);
    }
    catch (ex) {
      try {
        wrench.rmdirSyncRecursive(appHome);
      }
      catch (ex2) {
        wrench.rmdirSyncRecursive(appHome);
      }
    }
  }
  fs.mkdirSync(appHome);
});
