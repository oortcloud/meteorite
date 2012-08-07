var DDPClient = require('ddp');
var Config = require('./config');
var program = require('commander');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

program
  .option('-h, --host <hostname>', 'specify the server [atmosphere.meteor.com]', 'atmosphere.meteor.com')
  .option('-p, --port <port>', 'specify the server [443]', Number, 443)
  .parse(process.argv);

program.use_ssl = (program.port === 443) ? true : false;

Atmosphere = {
  publish: function(fn) {
    var config = new Config(process.cwd());
    
    // TODO Validation
    
    Atmosphere.login(function(ddpclient) {
      ddpclient.call("publish", [config], function(err) {
        if (err) {
          console.log('Error:', err.reason);
          process.exit();
        }
        fn();
      });
    });
  },

  release: function(fn) {
    var config = new Config(process.cwd());
    var versionName = 'v' + config.version;

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
      
      ddpclient.subscribe("packages", [{includeHidden: true}], function() {
        
        fn(Atmosphere._packages = ddpclient.collections.packages);
      });
    });
  },
  
  connect: function(fn) {
    var ddpclient = new DDPClient(program);
    
    ddpclient.connect(function() {
      fn(ddpclient);
    });
  },
  
  login: function(fn) {
    Atmosphere.connect(function(ddpclient) {
      program.prompt({
        username: 'username: ',
        password: 'password: '
      }, function(credentials) {
        
        ddpclient.call('login', [{
          user: {username: credentials.username},
          password: credentials.password
        }], function(err) {
          if (err) {
            console.log('Error:', err.reason);
            process.exit();
          }
          
          fn(ddpclient);
        });
      });
    });
  }
};

module.exports = Atmosphere;
