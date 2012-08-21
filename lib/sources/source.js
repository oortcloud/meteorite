var GitSource = require('./git');
var LocalSource = require('./local');
var AtmosphereSource = require('./atmosphere');


Source = {
  prepare: function(root, name, config) {
    var klass;
    
    if (config.path)
      klass = LocalSource;
    else if (config.git)
      klass = GitSource;
    else
      klass = AtmosphereSource;
    
    return new klass(root, name, config);
  }
};

module.exports = Source;
