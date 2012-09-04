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
    versions: [
      { git: 'A', version: '1.0', dependencies: {'C': {version: '1.C.atmos.A'}}}
    ]
  },
  {
    name: 'B',
    latest: '1.0',
    versions: [
      { git: 'B', version: '1.0', dependencies: {'C': {version: '1.C.atmos.B'}}}
    ]
  },
  {
    name: 'C',
    latest: '1.C.atmos.A',
    versions: [
      { git: 'C.atmos.A', version: '1.C.atmos.A', dependencies: {}},
      { git: 'C.atmos.B', version: '1.C.atmos.B', dependencies: {}},
    ]
  }
]

Atmosphere.packages = function(fn) {
  fn(PKG_DEFINITIONS);
};
