var path = require('path');

Env = {
	buildFromHomePath: function(subPath) {
		var homeDir = process.env.HOME
	    if (process.platform == 'win32') {
			var homeDir = process.env.LOCALAPPDATA || process.env.APPDATA;
	    }
		return path.join(homeDir, subPath);
	}
};

module.exports = Env;