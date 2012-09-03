// testing mock
var PKG_DEPENDENCIES = {
  'mrt-test-pkg1': {},
  'mrt-test-pkg2': {'mrt-test-pkg1': {
    "git": "https://github.com/possibilities/mrt-test-pkg1.git"
  }},
  'A': {},
  'B': {'A': {git: 'A.specified'}}
};

var PKG_COMMITS = {
  'mrt-test-pkg1': '3ab9c811313dbedc48269f39a78b86617653fa91',
  'mrt-test-pkg2': '223e2266b1c593abcdeaace1d5b0955b372e0f34'
};

Package.prototype.readDependenciesFromSource = function(fn) {
  
  // rather than downloading the package and reading the smart.json,
  // we are just going to fudge it from the above array
  this.dependencies = new Dependencies(this.source.path, PKG_DEPENDENCIES[this.name]);
  this.source.commit = PKG_COMMITS[this.name];
  fn();
};
