var path = require('path');
var fs = require('fs');
var _ = require('underscore');

Config = function(root) {
  this.root = root;
  var configPath = path.join(this.root, 'smart.json');

  if (path.existsSync(configPath))

    try {
      var rawConfig = fs.readFileSync(configPath).toString();
      var config = JSON.parse(rawConfig);
      _.extend(this, config);
    } catch(e) {
      console.log('Error: there was a problem parsing the dependency file for:', root, e);
    }

};

module.exports = Config;
