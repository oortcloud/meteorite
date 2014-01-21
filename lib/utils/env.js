var path = require('path');

Env = {
	buildFromHomePath: function(subPath) {
/*		console.log('process.env.HOME: ' + process.env.HOME);
		console.log('process.env.HOMEDRIVE: ' + process.env.HOMEDRIVE);
		console.log('process.env.HOMESHARE: ' + process.env.HOMESHARE);
		console.log('process.env.HOMEPATH: ' + process.env.HOMEPATH);*/

		var homeDir = process.env.HOME || (process.env.HOMEDRIVE || process.env.HOMESHARE) + process.env.HOMEPATH;
		return path.join(homeDir, subPath);
	}
};

module.exports = Env;