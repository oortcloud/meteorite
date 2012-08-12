var DDPClient = require('ddp');
var Config = require('./config');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var program = require('commander');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var git = require('./utils/git');
var _ = require('underscore');

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

program
  .option('-H, --repoHost <hostname>', 'specify the server [atmosphere.meteor.com]', 'atmosphere.meteor.com')
  .option('-P, --repoPort <port>', 'specify the server [443]', Number, 443)

  // WARNING! TODO! BULLSHIT ALARM!
  // Must dupe all of `meteor run`'s options to avoid issues when it needs to contact atomsphere
  // TODO Add better explanation
  // TODO Find a way to avoid all of this
  .option('-p, --port <port>', 'Port to listen on. NOTE: Also uses port N+1 and N+2. [3000]', Number, 3000)
  .option('--production', 'Run in production mode. Minify and bundle CSS and JS files.', Boolean, false)
  .parse(process.argv);

var use_ssl = (program.repoPort === 443) ? true : false;

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
      
      Atmosphere.login(function(ddpclient) {
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
  
  connect: function(fn) {
    var ddpclient = new DDPClient({
      port: program.repoPort,
      host: program.repoHost,
      use_ssl: use_ssl
    });
    
    ddpclient.connect(function() {
      fn(ddpclient);
    });
  },
  
  login: function(fn) {
    Atmosphere.connect(function(ddpclient) {
      
      var prompt = function() {
        program.prompt('username: ', function(username) {
          program.password('password: ', function(password) {
            ddpclient.call('login', [{
              user: {username: username},
              password: password
            }], function(err, user) {
              if (err) {
                console.log('Error:', err.reason);
                process.exit();
              }

              writeUserTokenFile(user);

              fn(ddpclient);
            });
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
            prompt();
          } else {
            fn(ddpclient);
          }
        });
      } else {
        prompt();
      }
        
    });
  }
};

module.exports = Atmosphere;
