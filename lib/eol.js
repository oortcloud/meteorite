var os = require('os');

// Users may have UNIX line endings on Windows if their git is configured
// in that way, see https://github.com/oortcloud/meteorite/pull/224#issuecomment-34903926
eol = {
  detectEol: function(data) {
    data = data || '';
    var eols = [ '\r\n', '\r', '\n' ];
    var result = os.EOL;
    for (var i = 0; i < eols.length; i++) {
      var eol = eols[i];
      if (data.indexOf(eol) >= 0) {
        result = eol;
        break;
      }
    };
    return result;
  }
}

module.exports = eol;
