var path = require('path');
var fs = require('fs');
var wrench = require('wrench');

fs.existsSync = fs.existsSync || path.existsSync;


// added this one, should I have?
// 
// rm -r or unlink a path
fs.ensureDeletedSync = function(path) {
  try {
    var stats = fs.lstatSync(path);

    if (stats.isSymbolicLink())
      fs.unlinkSync(path);
    else if (stats.isDirectory())
      wrench.rmdirSyncRecursive(path);
  } catch (err) {
    // pass
  }
}

module.exports = fs;
