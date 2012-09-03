// testing mock
var PKG_DEFINITIONS = [
  {
    name: 'mrt-test-pkg1',
    latest: '0.1.0',
    versions: [
      {
        git: 'https://github.com/possibilities/mrt-test-pkg1.git',
        version: '0.1.0',
        dependencies: {}
      },
      {
        git: 'https://github.com/possibilities/mrt-test-pkg1.git',
        version: '0.0.1',
        dependencies: {}
      }
    ]
  },
  {
    name: 'mrt-test-pkg2',
    latest: '0.1.0',
    versions: [
      {
        git: 'https://github.com/possibilities/mrt-test-pkg1.git',
        version: '0.1.0',
        dependencies: {
          'mrt-test-pkg1': {version: '0.1.0'}
        }
      }
    ]
  },
  {
    name: 'A',
    latest: '1.0',
    versions: [{ git: 'A', version: '1.0', dependencies: {}}]
  },
  {
    name: 'B',
    latest: '1.0',
    versions: [{ git: 'B', version: '1.0', dependencies: {'A': {}}}]
  }
]

Atmosphere.packages = function(fn) {
  fn(PKG_DEFINITIONS);
};
