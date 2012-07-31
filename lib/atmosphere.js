var DDPClient = require('ddp');
var Config = require('./config');
var program = require('commander');

program
  .option('-h, --host <hostname>', 'specify the server [atmosphere.meteor.com]', 'atmosphere.meteor.com')
  .option('-p, --port <port>', 'specify the server [443]', Number, 443)
  .parse(process.argv);

program.use_ssl = (program.port === 443) ? true : false;

Atmosphere = {
  publish: function(fn) {
    var config = new Config(process.cwd());
    
    // TODO - check what we need is in there
    
    Atmosphere.connect(function(ddpclient) {
      
      ddpclient.call("publish", [config], function(err) {
        if (err) {
          console.log('Error:', err.reason);
          process.exit();
        }
        fn();
      });
    });
  },
  
  connect: function(fn) {
    var ddpclient = new DDPClient(program);
    
    ddpclient.connect(function() {
      
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
