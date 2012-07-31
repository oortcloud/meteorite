var DDPClient = require('ddpclient');
var Config = require('./config');
var program = require('commander');

Atmosphere = {
  publish: function(fn) {
    var config = new Config(process.cwd());

    var ddpclient = new DDPClient({
      hostname: 'atmosphere.meteor.com',
      port: 443,
      use_ssl: true
    });

    ddpclient.on("connect-error", function(data) {
      console.log("An error occured connecting to '" + ddpclient.socket_url + "'");
      process.exit();
    });

    program.prompt({
      username: 'username: ',
      password: 'password: '
    }, function(credentials) {
      ddpclient.connect();
      
      ddpclient.on("connect", function(data) {
        ddpclient.on("msg-result-login", function(data) {
          ddpclient.on("msg-result-publish", function(data) {
            fn();
          });
          ddpclient.call("publish", [config]);
        });
        ddpclient.call("login", [{
          user: {
            username: credentials.username
          },
          password: credentials.password
        }]);
        
      });
    });
  }
};

module.exports = Atmosphere;
