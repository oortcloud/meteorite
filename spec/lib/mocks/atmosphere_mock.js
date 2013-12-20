var _ = require('underscore');

// testing mock
var PKG_DEFINITIONS = [
  {
    name: 'mrt-test-pkg1',
    latest: '0.1.0',
    versions: [
      {
        git: 'https://github.com/possibilities/mrt-test-pkg1.git',
        version: '0.1.0',
        packages: {}
      },
      {
        git: 'https://github.com/possibilities/mrt-test-pkg1.git',
        version: '0.0.1',
        packages: {}
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
        packages: {
          'mrt-test-pkg1': {version: '0.1.0'}
        }
      }
    ]
  },
  {
    name: 'A',
    latest: '1.0',
    versions: [
      { git: 'A', version: '1.0', packages: {'C': {version: '1.C.atmos.A'}}}
    ]
  },
  {
    name: 'B',
    latest: '1.0',
    versions: [
      { git: 'B', version: '1.0', packages: {'C': {version: '1.C.atmos.B'}}}
    ]
  },
  {
    name: 'C',
    latest: '1.C.atmos.A',
    versions: [
      { git: 'C.atmos.A', version: '1.C.atmos.A', packages: {}},
      { git: 'C.atmos.B', version: '1.C.atmos.B', packages: {}},
    ]
  }
]

Atmosphere.package = function(name, fn) {
  return fn(_.find(PKG_DEFINITIONS, function(d) { return d.name === name; }));
};
