var path = require('path');

Meteorite = {
  root: function() {
    var homeDir = process.env.HOME;
    return path.join(homeDir, '.meteorite');
  },
  prepareFS: function() {
    var root = Meteorite.root();
    if (!path.existsSync(root))
      fs.mkdir(root);
  }
};

module.exports = Meteorite;
