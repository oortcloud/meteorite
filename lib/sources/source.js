var GitSource = require('./git');
var LocalSource = require('./local');

Source = {
  prepare: function(root, config) {
    var klass = config.path ? LocalSource : GitSource;
    return new klass(root, config);
  }
};

module.exports = Source;
