var path = require('path');
var fs = require('fs');

Meteorite = {

  // Finds the path to ~/.meteorite
  root: function() {
    var homeDir = process.env.HOME;
    return path.join(homeDir, '.meteorite');
  },

  // Creates the path to ~/.meteorite
  prepareFS: function() {
    var root = Meteorite.root();
    if (!path.existsSync(root))
      fs.mkdir(root);
  }

};

module.exports = Meteorite;
