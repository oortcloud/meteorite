var _ = require('underscore');

var oldConsoleLog = console.log;
console.log = function() {
  var args = _.toArray(arguments);
  args.unshift('  ~| ');
  oldConsoleLog.apply(console, args);
};

console.header = function() {
  oldConsoleLog('   +/----------------------------------------------------->-+');
};

console.divider = function() {
  oldConsoleLog('   |------------------------------------------------------>-+');
};

console.footer = function() {
  oldConsoleLog('   +\\----------------------------------------------------->-+');
};

console.blank = function() {
  oldConsoleLog();
};
