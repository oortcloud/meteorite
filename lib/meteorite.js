var path = require('path');

Meteorite = {
  root: function() {
    var homeDir = process.env.HOME;
    return path.join(homeDir, '.meteorite');
  }
};

module.exports = Meteorite;
