var _ = require('underscore');
var meteoriteArgs = require('optimist').argv;

var originalLog = console.log;
console.log = function() {
  if (!console._suppressed) {
    var args = _.toArray(arguments);
    originalLog.apply(console, args);
  }
};

console.suppress = function() {
  console._suppressed = true;
};

console.unsuppress = function() {
  console._suppressed = false;
};

console.verbose = function() {
  if (meteoriteArgs.verbose)
    console.log.apply(console, arguments);
};
