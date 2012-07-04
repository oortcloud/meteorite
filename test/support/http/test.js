var http = require('http');
var fs = require('fs');
var path = require('path');
var connect = require('connect');
var mime = require('mime');

var verbose = false;

TestServer = {
  start: function(onStarted) {
    var app = connect();
    app.use(connect.static(__dirname));
    app.listen(7357);
    if (verbose)
      console.log('Test server running at http://127.0.0.1:7357/');
    onStarted();
  }
};

module.exports = TestServer;
