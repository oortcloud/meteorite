// testing mock
var PKG_DEPENDENCIES = {
  'mrt-test-pkg1': {},
  'mrt-test-pkg2': {'mrt-test-pkg1': {
    "git": "https://github.com/possibilities/mrt-test-pkg1.git"
  }}
}

Package.prototype.readDependencies = function(fn) {
  
  // rather than downloading the package and reading the smart.json,
  // we are just going to fudge it from the above array
  this.dependencies = new Dependencies(this.source.path, PKG_DEPENDENCIES[this.name]);
  fn()
}