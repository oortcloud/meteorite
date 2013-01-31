var path = require('path');

// testing mock
var GIT_PKG_DEPENDENCIES = {
  'mrt-test-pkg1': {},
  'mrt-test-pkg2': {'mrt-test-pkg1': {
    "git": "https://github.com/possibilities/mrt-test-pkg1.git"
  }},
  'A': {'C': {git: 'C.git.A'}},
  'B': {'C': {git: 'C.git.B'}}
};

var LOCAL_PKG_DEPENDENCIES = {
  'A': {'C': {path: '/C.path.A'}},
  'B': {'C': {path: '/C.path.B'}},
  'mrt-test-pkg1': {},
  'mrt-test-pkg2': {'mrt-test-pkg1': {
    'path': '../mrt-test-pkg1', 'root': '../../mrt-test-pkg2'}}
};


var PKG_COMMITS = {
  'mrt-test-pkg1': '3ab9c811313dbedc48269f39a78b86617653fa91',
  'mrt-test-pkg2': '223e2266b1c593abcdeaace1d5b0955b372e0f34'
};

// rather than downloading the package and reading the smart.json,
// we are just going to fudge it from the above array
Package.prototype.readDependenciesFromSource = function(fn) {
  
  if (this.source instanceof LocalSource) {
    this.dependencies = new Dependencies(LOCAL_PKG_DEPENDENCIES[this.name]);
  } else {
    this.dependencies = new Dependencies(GIT_PKG_DEPENDENCIES[this.name]);
    this.source.commit = PKG_COMMITS[this.name];
  }
  
  fn();
};
