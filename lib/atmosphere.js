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
  publish: function(fn, args) {

    if (args._.length !== 2)
      throw "Usage: mrt publish <path>";
    
    var packagePath = args._[1];
    var config = new Config(path.resolve(packagePath));
    var versionName = 'v' + config.version;
    
    // check that the version we are releasing is tagged in the repo
    git.tagExists(versionName, packagePath, function(err, exists) {
      if (err || !exists)
        throw "Tag " + versionName + " doesn't exist in repository, please add!";
      
      // TODO Validation
      
      Atmosphere.login(args, function(ddpclient) {
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
          console.log("Done!");
          fn();
        });
      });
    });
  },

  release: function(fn, args) {
    var config = new Config(process.cwd());
    var versionName = 'v' + config.version;

    if (args._.length !== 2)
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
              Atmosphere.publish(fn, args);
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
      
      ddpclient.subscribe("packages", [{includeHidden: true}], function() {
        
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
  
  connect: function(args, fn) {
    args.repoHost = args.repoHost || 'atmosphere.meteor.com';
    args.repoPort = args.repoPort || 443;
    var use_ssl = (args.repoPort === 443) ? true : false;
    console.log({
      port: args.repoPort,
      host: args.repoHost,
      use_ssl: use_ssl
    });
    var ddpclient = new DDPClient({
      port: args.repoPort,
      host: args.repoHost,
      use_ssl: use_ssl
    });
    
    ddpclient.connect(function() {
      fn(ddpclient);
    });
  },
  
  login: function(args, fn) {

    Atmosphere.connect(args, function(ddpclient) {
      prompt.start();

      var showPrompt = function() {
        prompt.get({
            properties: {
              username: {
                required: true
              },
              password: {
                required: true,
                hidden: true
              }
            }
          }, function (err, input) {
          ddpclient.call('login', [{
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
        ddpclient.call('login', [{
          resume: user.token
        }], function(err, user) {
          if (err) {
            showPrompt();
          } else {
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
