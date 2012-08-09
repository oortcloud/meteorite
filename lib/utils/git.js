var exec = require('child_process').exec;
var _ = require('underscore');

// a very simple interface into git
var git = {};


// git.tagExists(tag, [directory], callback)
//
// is the tag set in directory? (default '.')
git.tagExists = function(tag, directory, callback) {

  // is there a pattern for this kind of thing?
  if (arguments.length < 3) {
    callback = directory;
    directory = '.';
  }
  
  git.tags(directory, function(error, tags) {
    
    callback(error, _.include(tags, tag));
  });
}

// git.tags([directory], callback)
//
// list all tags set in directory? (default '.')
git.tags = function(directory, callback) {
  
  if (arguments.length < 2) {
    callback = directory;
    directory = '.';
  }
  
  exec('git tag', {cwd: directory}, function(error, stdout, stderr) {
    
    callback(error, stdout.trim().split('\n'));
  });
}

module.exports = git;