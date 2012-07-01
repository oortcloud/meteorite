var path = require('path');
var _ = require('underscore');
_.str = require('underscore.string');
var Repo = require('./repo');
var fs = require('fs');
var fstream = require('fstream');
var wrench = require('wrench');
var spawn = require('child_process').spawn;

// A 'Meteor' refers to a single commit (branch, tag) of a version of the core meteor
//
// They are located on disk in ~/.meteorite/meteors.
// When you install a meteor into a project, it copies everything into
// ./.meteor/meteorite to create a 'custom' version of meteor for you to install packages into.
Meteor = function(config) {

  // Config defaults
  config || (config = {});
  config.git || (config.git = 'https://github.com/meteor/meteor.git');

  // Init repo
  this.repo = new Repo(config);

  // Build up repo path
  this.repo.path = path.join(Meteorite.root(), 'meteors', this.repo.checkout, this.repo.head);
};

// download the repo + install dev_bundle
Meteor.prototype.prepare = function(fn) {
  var self = this;

  if (self.repo.isCloned())
    return fn();
  
  console.log('Fetching Meteor (' + self.repo.checkout + ': ' + self.repo.head + ')...');
  self.repo.fetch(function() {
    // ensure the dev_bundle is installed.
    var dev_bundle = path.join(self.repo.path, 'dev_bundle');
    
    fs.stat(dev_bundle, function(err, stats) {
      // a little hack. meteor --help installs the dev bundle before doing anything else
      if (err) {
        console.log('Downloading Meteor development bundle...')
        var meteor = spawn('./meteor', ['--help'], {cwd: self.repo.path});
        
        // just output the status bar
        meteor.stderr.pipe(process.stderr);
        meteor.on('exit', fn);
      } else {
        fn()
      }
    });
    
  });
}

// install a downloaded meteor into a project
Meteor.prototype.install = function(project, fn) {

  if (!path.existsSync(path.join(project.installRoot, 'meteor'))) {
    
    // Copy meteor from ~/.meteorite/meteors to ./.meteor/meteorite
    var reader = fstream.Reader(this.repo.path);
    var writer = fstream.Writer(project.installRoot);
  
    // Cleanup
    writer.on('close', fn)
  
    // Do it already
    reader.pipe(writer);

  } else {
    fn();
  }
};

module.exports = Meteor;
