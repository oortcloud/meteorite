var path = require('path');
var fs = require('fs');
var _ = require('underscore');

// A wrapper class for `smart.json` configurations

Config = function(root) {

  // Build up path
  var configPath = path.join(root, 'smart.json');

  // Make sure path exists
  if (fs.existsSync(configPath)) {
    
    var config = this._parseConfig(configPath);
    
    // Add all settings in config to this object
    _.extend(this, config);
    
    // store where we got this from, so we can absolutize later
    if (this.meteor)
      this.meteor.root = root;
    _.each(this.packages, function(pkg) { pkg.root = root; });
  }
};

Config.prototype._parseConfig = function(configPath) {
  // Read the config and parse it
  var config;

  try {

    config = fs.readFileSync(configPath).toString();
    config = JSON.parse(config);
    config = this._expandPackages(config);

    return config;
  } catch(e) {
    throw('Error: there was a problem parsing ' + configPath + ':\n' + e.message);
  }
};

Config.prototype._expandPackages = function(config) {
  if (config.packages) {
    _.each(config.packages, function(pkg, name) {
      if (_.isString(config.packages[name])) {
        var version = config.packages[name];
        config.packages[name] = {
          version: version
        };
      }
    });
  }
  
  return config;
};

module.exports = Config;
