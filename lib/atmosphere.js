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
var wrench = require('wrench');

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
  // migrate a package to troposphere
  migratePackage: function(fn) {
    // XXX: either get username how meteor does or from atmosphere
    if (meteoriteArgs._.length !== 3)
      throw "Usage: mrt migrate-package <path> <username:package>";
    
    var packagePath = meteoriteArgs._[1];
    var config = new Config(path.resolve(packagePath));
    
    var newPackagePath = meteoriteArgs._[2];
    var newPackageName = path.basename(newPackagePath);
    
    console.log(("1. Copying package to " + newPackagePath).green);
    wrench.copyDirSyncRecursive(packagePath, newPackagePath);
    // no sense in keeping smart.json
    fs.unlinkSync(path.join(newPackagePath, 'smart.json'));
    
    var packageJS = fs.readFileSync(path.join(newPackagePath, 'package.js')).toString();
    
    var release = 'METEOR@0.9.0';
    var version = config.version;
    console.log(("2. Setting version " + version + " to work with release " + release).green);
    var versionLine = '  version: "' + version + '"';
    packageJS = packageJS.replace(/Package\.describe[^]*[{^][\s'"]*summary.*['"]/m, 
      "$&,\n" + versionLine);
    
    var versionsFromLine = '  api.versionsFrom("' + release + '");';
    packageJS = packageJS.replace(/Package\.on_use.*/, "$&\n" + versionsFromLine);
    
    var git = config.git;
    if (git) {
      console.log(("3. Setting git URL to " + git).green);
      var gitLine = '  git: "' + git + '"'
      packageJS = packageJS.replace(versionLine, versionLine + ',\n' + gitLine);
    }
    
    console.log("4. Setting package dependencies".green);
    console.log(("4.0 Updating references to " + config.name + ' to ' + newPackageName).yellow);
    
    // update all instances of api.use or api.imply
    var updateUses = function(str, name, newName) {
      return str.replace(new RegExp("(api\.(use|imply).*)['\"]" + name + "['\"]"), 
        '$1"' + newName + '"');
    }
    
    packageJS = updateUses(packageJS, config.name, newPackagePath);
    
    var complete = 0, i = 0;
    _.each(config.packages, function(dep, name) {
      i += 1;
      console.log(("4." + i + " Adding " + name + ' ' + (dep.version || 'latest')).yellow);
      
      if (dep.git || dep.path) {
        // XXX: can we?
        console.error("Error: Can't migrate packages with non atmosphere dependencies");
        process.exit(1);
      }
      
      Atmosphere.package(name, function(pkg) {
        if (! pkg) {
          console.log("Error: no package named ", name, " found on Atmosphere");
          process.exit(1);
        }
        
        var version = _.find(pkg.versions, function(v) { 
          return v.version === (dep.version || pkg.latest);
        });
        
        if (! version) {
          console.error("Error: couldn't find version", (dep.version || pkg.latest), 
            "of package", name, "on Atmosphere");
          process.exit(1);
        }
        
        if (! version.troposphereIdentifier) {
          console.error("Error: No troposphere version of", (dep.version || pkg.latest), 
            "of package", name, "yet registered");
          process.exit(1)
        }
        
        // we are good, replace references to name with troposphere id
        packageJS = updateUses(packageJS, name, version.troposphereIdentifier);
        
        complete += 1;
        if (complete === _.keys(config.packages).length)
          done()
      });
    });
    
    var done = function() {
      fs.writeFileSync(path.join(newPackagePath, 'package.js'), packageJS);
      fn();
    }
    
    if (! config.packages || _.keys(config.packages).length === 0)
      done();
  },
  
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
              
            process.exit(1);
          }
          meteoriteArgs.verbose && console.log("Published.");
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
      if (err && err.code === 1) {
        throw "There are files that need to be committed first.";
      }
      else if (err) {
        throw "Command exited: " + err;
      }

      exec('git tag', function (err, stdout, stderr) {
        if (err) {
          throw "Command exited: " + err;
        }

        if (stdout.indexOf(versionName) >= 0)
          throw "This tag has already been committed to the repo.";

        console.log('Adding tag and pushing repo');
        spawn('git', ['tag', versionName]).on('exit', function(code, signal) {
          if (code || signal) {
            throw "Command exited with " + code + "/" + signal;
          }
          spawn('git', ['push']).on('exit', function(code, signal) {
            if (code || signal) {
              throw "Command exited with " + code + "/" + signal;
            }
            spawn('git', ['push', '--tags']).on('exit', function(code, signal) {
              if (code || signal) {
                throw "Command exited with " + code + "/" + signal;
              }
              Atmosphere.publish(fn);
            });
          });
        });
      });
    });
    
  },
  
  // first stab at this: just grab _all_ the package meta data from the server, and go from there
  // packages: function(fn) {
  //   if (Atmosphere._packages)
  //     return fn(Atmosphere._packages);
  //   
  //   Atmosphere.connect(function(ddpclient) {
  //     
  //     meteoriteArgs.verbose && console.log("Getting packages...");
  //     ddpclient.subscribe("allPackages", [], function() {
  //       meteoriteArgs.verbose && console.log("Got packages.");
  //       
  //       fn(Atmosphere._packages = ddpclient.collections.packages);
  //     });
  //   });
  // },
  
  // find the info about a specific named package
  package: function(name, fn) {
    
    Atmosphere.connect(function(ddpclient) {
      
      meteoriteArgs.verbose && console.log("Getting package info for " + name + "...");
      ddpclient.subscribe("package", [name], function() {
        meteoriteArgs.verbose && console.log("Got package info for " + name + ".");
        
        var packages = ddpclient.collections.packages;
        fn(_.find(packages, function(d) { return d.name === name; }));
      });
    });
  },
  
  countInstall: function(pkg, fn) {
    Atmosphere.connect(function(ddpclient) {
      meteoriteArgs.verbose && console.log("Counting an install of " + pkg.name + " at version " + pkg.version + "...");
      ddpclient.call('countInstall', [pkg.name, pkg.version], function(err) {
        meteoriteArgs.verbose && console.log("Done counting install.");
        
        if (err)
          console.log('Error counting install: ', err.reason);
        
        fn();
      });
    });
  },
  
  connect: function(fn) {
    // cache.
    if (Atmosphere._client)
      return fn(Atmosphere._client);
    
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
        process.exit(1);
      }
        
      meteoriteArgs.verbose && console.log("Connected..");
      fn(Atmosphere._client = ddpclient);
    });
  },

  disconnect: function() {
    if (Atmosphere._client) {
      Atmosphere._client.close();
      delete Atmosphere._client;
    }      
  },
  
  login: function(fn) {
    Atmosphere.connect(function(ddpclient) {
      prompt.start();

      prompt.message = "";
      prompt.delimiter = "";

      var showPrompt = function() {
        meteoriteArgs.verbose && console.log("Getting credentials..");
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
          if (err) {
            console.log('Error:', err.reason);
            process.exit(1);
          }
          
          meteoriteArgs.verbose && console.log("Got credentials, logging in..");
          ddpclient.call('login', ['mrt', version, {
            password: input.password,
            user: {
              username: input.username
            }
          }], function(err, user) {
            
            if (err) {
              console.log('Error:', err.reason);
              process.exit(1);
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
      } else if (meteoriteArgs.repoUsername && meteoriteArgs.repoPassword) {
        
        ddpclient.call('login', ['mrt', version, {
          user: {username: meteoriteArgs.repoUsername},
          password: meteoriteArgs.repoPassword
        }], function(err, user) {
          if (err) {
            console.log('Error:', err.reason);
            process.exit(1);
          }
          
          meteoriteArgs.verbose && console.log("Logged in.");
          fn(ddpclient);
        });
        
      } else {
        showPrompt();
      }
        
    });
  }
};

module.exports = Atmosphere;
