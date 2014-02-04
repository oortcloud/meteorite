var path = require('path');

if (process.platform === 'win32') {
  // Slashes are automatically normalized by path.resolve on Windows
  shortPath = 'spec/support/bin/mrt.bat';
} else {
  shortPath = 'bin/mrt.js';
};

Env = {
  meteoriteExecutable: path.resolve(shortPath)
}
module.exports = Env;
