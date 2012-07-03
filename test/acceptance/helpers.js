var spawn = require('child_process').spawn;
var path = require('path');
var wrench = require('wrench');

var uninstall = function(fn) {
  var root = Meteorite.root();

  if (path.existsSync(root))
    wrench.rmdirSyncRecursive(root);
    
  fn();
};

var invoke = function(command, directory, options, fn) {
  directory = path.resolve(path.join('test', 'support', 'apps', directory));
  var args = command.split(' ');
  var mrt = spawn('mrt', args, { cwd: directory });

  var output = '';
  mrt.stdout.on('data', function(data) {
    output = output + data.toString();
    if (output.indexOf(options.expect) >= 0)
      fn();
  });
};

exports.uninstall = uninstall;
exports.invoke = invoke;
