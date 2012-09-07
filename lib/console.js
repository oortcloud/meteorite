var _ = require('underscore');

var oldConsoleLog = console.log;
console.log = function() {
  if (!console._suppressed) {
    var args = _.toArray(arguments);
    args.unshift('  ~| ');
    oldConsoleLog.apply(console, args);
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
    oldConsoleLog('   +/----------------------------------------------------------------------->-+');
};

console.divider = function() {
  if (!console._suppressed)
    oldConsoleLog('   |------------------------------------------------------------------------>-+');
};

console.footer = function() {
  if (!console._suppressed)
    oldConsoleLog('   +\\----------------------------------------------------------------------->-+');
};

console.blank = function() {
  if (!console._suppressed)
    oldConsoleLog();
};
