var http = require('http');
var fs = require('fs');
var path = require('path');
var connect = require('connect');
var spawn = require('child_process').spawn;

var verbose = false;

var startServer = function(onStarted) {
  var app = connect();
  app.use(connect.static(path.join(__dirname, 'files')));
  app.listen(7357);
  if (verbose)
    console.log('Test server running at http://127.0.0.1:7357/');
  onStarted();
};

var getDevBundle = function(onPrepared) {
  var root = path.join(__dirname, 'files');
  var fileName = 'dev_bundle_Darwin_x86_64_0.1.5.tar.gz';
  var filePath = path.join(root, fileName);

  var prepare = function() {
    console.log("First run: downloading dev bundle for testing");

    var url = 'http://d3sqy0vbqsdhku.cloudfront.net/' + fileName;

    var curl = spawn('curl', ['-#', '-O', url], {
      cwd: root
    });

    curl.on('exit', function() {
      onPrepared();
    });
  };
  
  if (path.existsSync(filePath))
    onPrepared();
  else
    prepare();
};

TestServer = {
  start: function(onStarted) {
    getDevBundle(function() {
      startServer(onStarted);
    });
  }
};

module.exports = TestServer;
