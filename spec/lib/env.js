var path = require('path');

Env = {
  meteoriteExecutable: path.resolve(path.join('bin', 'mrt.' + (process.platform === 'win32' ? 'bat' : 'js')))
};

module.exports = Env;
