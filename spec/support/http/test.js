var http = require('http');
var fs = require('fs');
var path = require('path');
var wrench = require('wrench');
var connect = require('connect');
var spawn = require('child_process').spawn;
var _ = require('underscore');

var verbose = false;

var startServer = function(onStarted) {
  var app = connect();
  app.use(connect.static(path.join(__dirname, 'files')));
  app.listen(7357);
  if (verbose)
    console.log('Test server running at http://127.0.0.1:7357/');
  onStarted();
};

var fetchDevBundle = function(onFetched) {
  var root = path.join(__dirname, 'files');
  var fileName = 'dev_bundle_Darwin_x86_64_0.1.5.tar.gz';
  var filePath = path.join(root, fileName);

  var prepare = function() {

    var url = 'http://d3sqy0vbqsdhku.cloudfront.net/' + fileName;
    console.log("Fetching test suite dependency:", url);

    var curl = spawn('curl', ['-#', '-O', url], {
      cwd: root
    });

    curl.on('exit', function() {
      onFetched();
    });
  };
  
  if (path.existsSync(filePath))
    onFetched();
  else
    prepare();
};

var fetchRepo = function(url, onFetched) {
  var urlParts = url.split('/');
  var repo = urlParts.pop();
  var user = urlParts.pop();
  var repoPath = path.resolve('spec/support/http/files/' + user + '/' + repo);

  var _onFetched = function() {
    var git = spawn('/usr/local/bin/git', ['update-server-info'], {
      cwd: repoPath
    });

    git.on('exit', function() {
      onFetched();
    });
  };

  if (!path.existsSync(repoPath)) {
    console.log("Fetching test suite dependency:", url);
    var git = spawn('/usr/local/bin/git', ['clone', url, repoPath]);

    git.on('exit', function() {
      _onFetched();
    });
  } else {
    _onFetched();
  }
};

var fetchRepos = function(repos, fn) {
  var fetchCount = 0;
  var onFetched = function() {
    fetchCount++;
    if (fetchCount >= repos.length)
      fn();
  }
  _.each(repos, function(repo) {
    fetchRepo(repo, onFetched);
  });
};

TestServer = {
  start: function(onStarted) {
    fetchDevBundle(function() {
      fetchRepos([
        'https://github.com/possibilities/meteorite-test-package',
        'https://github.com/meteor/meteor'
      ], function() {
        startServer(onStarted);
      });
    });
  }
};

module.exports = TestServer;
