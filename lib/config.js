var path = require('path');
var fs = require('fs');
var _ = require('underscore');

// A wrapper class for `smart.json` configurations

Config = function(root) {

  // Build up path
  var configPath = path.join(root, 'smart.json');

  // Make sure path exists
  if (path.existsSync(configPath))

    try {
      
      // Read the config and parse it
      var rawConfig = fs.readFileSync(configPath).toString();
      var config = JSON.parse(rawConfig);
      
      // Add all settings in config to this object
      _.extend(this, config);

    } catch(e) {
      console.log('Error: there was a problem parsing the dependency file for:', root, e);
    }

};

module.exports = Config;
