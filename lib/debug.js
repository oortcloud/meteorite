var _ = require('underscore');

_.mixin({
  debugClass: function(className) {
    _.each(global[className].prototype, function(fn, name) {
      if (_.isFunction(fn)) {
        global[className].prototype[name] = function() {
          console.log(className + '#' + name);
          return fn.apply(this, arguments)
        };
      }
    });
  }
});
