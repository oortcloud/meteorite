var DDPClient = require('ddp');
var Config = require('./config');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var git = require('./utils/git');
var _ = require('underscore');
var prompt = require('prompt');
var meteoriteArgs = require('optimist').argv;
var version = require('../package').version;

var writeUserTokenFile = function(user) {
  var cfg = {
    user: user
  };
  var filePath = path.join(process.env.HOME, '.mrt.cfg');

  fs.writeFileSync(filePath, JSON.stringify(cfg));
  fs.chmodSync(filePath, '0600');
};

var readUserTokenFile = function() {
  var filePath = path.join(process.env.HOME, '.mrt.cfg');

  var fileContents = fs.readFileSync(filePath);
  return JSON.parse(fileContents);
};

Atmosphere = {
  publish: function(fn) {

    if (meteoriteArgs._.length !== 2)
      throw "Usage: mrt publish <path>";
    
    var packagePath = meteoriteArgs._[1];
    var config = new Config(path.resolve(packagePath));
    var versionName = 'v' + config.version;
    
    // check that the version we are releasing is tagged in the repo
    git.tagExists(versionName, packagePath, function(err, exists) {
      if (err || !exists)
        throw("Tag " + versionName + " doesn't exist in repository, please add!");
      
      // TODO Validation
      
      Atmosphere.login(function(ddpclient) {
        meteoriteArgs.verbose && console.log("Publishing...");
        ddpclient.call("publish", [config], function(err) {
          if (err) {
            console.log('Error:', err.reason);

            if (err.details && err.details.length > 0) {
              _.each(err.details, function(errMessage) {
                console.log('  ' + errMessage);
              });
            }
              
            process.exit();
          }
          meteoriteArgs.verbose && console.log("Published.");
          console.log("Done!");
          fn();
        });
      });
    });
  },

  release: function(fn) {
    var config = new Config(process.cwd());
    var versionName = 'v' + config.version;

    if (meteoriteArgs._.length !== 2)
      throw "Usage: mrt release <path>";

    // check clean first
    exec('git diff --exit-code', function (err, stdout, stderr) {
      if (err && err.code === 1)
        throw "There are files that need to be committed first.";

      exec('git tag', function (err, stdout, stderr) {
        if (stdout.indexOf(versionName) >= 0)
          throw "This tag has already been committed to the repo.";

        console.log('Adding tag and pushing repo');
        spawn('git', ['tag', versionName]).on('exit', function() {
          spawn('git', ['push']).on('exit', function() {
            spawn('git', ['push', '--tags']).on('exit', function() {
              Atmosphere.publish(fn);
            });
          });
        });
      });
    });
    
  },
  
  // first stab at this: just grab _all_ the package meta data from the server, and go from there
  packages: function(fn) {
    if (Atmosphere._packages)
      return fn(Atmosphere._packages);
    
    Atmosphere.connect(function(ddpclient) {
      
      meteoriteArgs.verbose && console.log("Getting packages...");
      ddpclient.subscribe("allPackages", [], function() {
        meteoriteArgs.verbose && console.log("Got packages.");
        
        fn(Atmosphere._packages = ddpclient.collections.packages);
      });
    });
  },
  
  // find the info about a specific named package
  package: function(name, fn) {
    Atmosphere.packages(function(defns) {
      fn(_.find(defns, function(d) { return d.name === name; }));
    });
  },
  
  connect: function(fn) {
    meteoriteArgs.repoHost = meteoriteArgs.repoHost || 'atmosphere.meteor.com';
    meteoriteArgs.repoPort = meteoriteArgs.repoPort || 443;
    var use_ssl = (meteoriteArgs.repoPort === 443) ? true : false;
    var ddpclient = new DDPClient({
      port: meteoriteArgs.repoPort,
      host: meteoriteArgs.repoHost,
      use_ssl: use_ssl
    });
    
    meteoriteArgs.verbose && console.log("Connecting to " + meteoriteArgs.repoHost + ":" + meteoriteArgs.repoPort + "...");
      
    ddpclient.connect(function(err) {
      if (err) {
        console.log("Connection to Atmosphere server failed!".red);
        console.log("Please ensure you are running the latest version of Meteorite".red);
        console.log("  npm install -g meteorite".red);
        console.log("If problems persist, please report here: http://github.com/oortcloud/meteorite/issues".red);
        process.exit();
      }
        
      meteoriteArgs.verbose && console.log("Connected..");
      fn(ddpclient);
    });
  },
  
  login: function(fn) {
    
    Atmosphere.connect(function(ddpclient) {
      prompt.start();

      prompt.message = "";
      prompt.delimiter = "";

      var showPrompt = function() {
        prompt.get({
            properties: {
              username: {
                description: 'username: ',
                required: true
              },
              password: {
                description: 'password: ',
                required: true,
                hidden: true
              }
            }
          }, function (err, input) {
          ddpclient.call('login', ['mrt', version, {
            password: input.password,
            user: {
              username: input.username
            }
          }], function(err, user) {
            if (err) {
              console.log('Error:', err.reason);
              process.exit();
            }

            writeUserTokenFile(user);

            fn(ddpclient);
          });
        });

      };

      var user;
      try {
        user = readUserTokenFile().user;
      } catch(e) {}
      
      if (user && user.token) {
        meteoriteArgs.verbose && console.log("Logging in...");
        ddpclient.call('login', ['mrt', version, {
          resume: user.token
        }], function(err, user) {
          if (err) {
            meteoriteArgs.verbose && console.log("Failed.");
            showPrompt();
          } else {
            meteoriteArgs.verbose && console.log("Logged in.");
            fn(ddpclient);
          }
        });
      } else {
        showPrompt();
      }
        
    });
  }
};

module.exports = Atmosphere;
