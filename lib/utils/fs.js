var path = require('path');
var fs = require('fs');

fs.existsSync = fs.existsSync || path.existsSync;

module.exports = fs;
