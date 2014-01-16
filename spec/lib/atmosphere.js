var path = require('path');
var exec = require('child_process').exec;
var utils = require('../lib/utils.js');
var _ = require('underscore');
var async = require('async');
var assert = require('assert');


var baseCommand = path.resolve(path.join('bin', 'mrt.js')) + '  --repoHost localhost --repoPort 3333 --repoUsername test --repoPassword testtest';

var packagesNeeded = {
  'mrt-test-pkg1': ['0.1.0', '0.2.0'],
  'mrt-test-pkg2': ['0.1.0']
}

var getPackageInfo = function(name, fn) {
  // perhaps it's weird to do it like this, but it works
  var cmd = exec(baseCommand + ' search ' + name, function(err, output) {
    return fn(err, output ? JSON.parse(output) : null);
  });
}

var getPackageInstallCount = function(name, version, fn) {
  getPackageInfo(name, function(err, data) {
    if (err)
      return fn(err);
    
    var details = _.find(data.versions, function(d) { return d.version == version; });
    
    if (details)
      fn(null, details.installCount || 0, data.installCount || 0);
    else
      fn(new Error('No version ' + version + ' of ' + name + ' found'));
  });
}

var assertIncreasesInstallCount = function(name, version, increment, done, step) {
  var tasks = [], totalInstallCount = 0, versionInstallCount = 0;
  
  tasks.push(function(next) {
    getPackageInstallCount(name, version, function(err, count, totalCount) {
      if (err)
        return done(err);
      
      versionInstallCount = count;
      totalInstallCount = totalCount;
      next();
    })
  });
  
  tasks.push(step);
  
  tasks.push(function(next) {
    getPackageInstallCount(name, version, function(err, count, totalCount) {
      if (err)
        return done(err);
      
      assert.equal(count, versionInstallCount + increment);
      assert.equal(totalCount, totalInstallCount + increment);
      next();
    })
  });
  
  tasks.push(function() { done(); });
  
  async.series(tasks);
}

var loadPackages = function(done) {
  var tasks = []
  var existingVersions = {};
  
  _.each(packagesNeeded, function(versions, name) {
    
    tasks.push(function(next) {
      getPackageInfo(name, function(err, existingData) {
        if (err)
          return done(new Error("Problem finding package " + name + ": " + err));
        
        existingVersions[name] = [];
        if (existingData)
          existingVersions[name] = _.pluck(existingData.versions, 'version');
        
        next();
      });
    });
    
    _.each(versions, function(version) {
      tasks.push(function(next) {
        if (_.include(existingVersions[name], version))
          return next();

        var packageDir = path.join(utils.packagesDir, name);
        exec('git checkout v' + version, {cwd: packageDir}, function(err) {
          if (err)
            return done(new Error("Problem checking out package version: " + name + " " + version + " : " + err));
          
          var cmd = exec(baseCommand + ' publish .', {cwd: packageDir}, function(err, output) {
            if (err) {
              if (output.match(/user not found/i))
                return done(new Error("Ensure you've added the test user (with password testtest) to your local atmosphere server"));
              
              return done(new Error("Problem publishing package: " + name + " " + version + " :\n"  + err + '\n' + output));
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

exports.getPackageInfo = getPackageInfo;
exports.getPackageInstallCount = getPackageInstallCount;
exports.assertIncreasesInstallCount = assertIncreasesInstallCount;
exports.loadPackages = loadPackages;
