var path = require('path');
var fs = require('fs');
var wrench = require('wrench');
var _ = require('underscore');
var ddp = require('ddp');

var utils = require('../lib/utils.js');
var atmosphere = require('../lib/atmosphere.js');

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
  wrench.mkdirSyncRecursive(appHome);
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
    atmosphere.loadPackages(done);
  });
});


beforeEach(function() {
  // clear out the fake home directory
  if (fs.existsSync(appHome))
    wrench.rmdirSyncRecursive(appHome);
  fs.mkdirSync(appHome);
});
