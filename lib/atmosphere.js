var DDPClient = require('ddpclient');
var Config = require('./config');
var program = require('commander');

program
  .option('-h, --hostname <hostname>', 'specify the server [atmosphere.meteor.com]', 'atmosphere.meteor.com')
  .option('-p, --port <port>', 'specify the server [443]', Number, 443)
  .parse(process.argv);

program.use_ssl = (program.port === 443) ? true : false;

Atmosphere = {
  publish: function(fn) {
    var config = new Config(process.cwd());
    var ddpclient = new DDPClient(program);

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
