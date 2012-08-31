var GitSource = require('./git');
var LocalSource = require('./local');


Source = {
  prepare: function(root, config) {
    var klass;
    
    if (config.path)
      klass = LocalSource;
    else
      klass = GitSource;
    
    return new klass(root, config);
  }
};

module.exports = Source;
