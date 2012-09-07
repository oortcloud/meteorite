var _ = require('underscore');
var meteoriteArgs = require('optimist').argv;

var originalLog = console.log;
console.log = function() {
  if (!console._suppressed) {
    var args = _.toArray(arguments);
    args.unshift('  ~| ');
    originalLog.apply(console, args);
  }
};

console.suppress = function() {
  console._suppressed = true;
};

console.unsuppress = function() {
  console._suppressed = false;
};

console.header = function() {
  if (!console._suppressed)
    originalLog('   +/----------------------------------------------------------------------->-+');
};

console.divider = function() {
  if (!console._suppressed)
    originalLog('   |------------------------------------------------------------------------>-+');
};

console.footer = function() {
  if (!console._suppressed)
    originalLog('   +\\----------------------------------------------------------------------->-+');
};

console.blank = function() {
  if (!console._suppressed)
    originalLog();
};

console.verbose = function() {
  if (meteoriteArgs.verbose)
    console.log.apply(console, arguments);
};
