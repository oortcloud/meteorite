var _ = require('underscore');

var debug = function(str) {
  return;
  console.log(str);
}

// The meteorite resolver.
//
// Given a list of dependencies (consisting of basePackages each of which is a range of package versions
// for a single package), resolve to a concrete list of packages (each of which is a fixed version).
//
// If called without force, will fail if the same package is included with different source types.
// Otherwise, uses the heuristic: path > git > atmos, with a first come first served approach within
// subtype.
//
// PROPOSED ALGORITHM:
//
// The resolver uses a backtracking search algorithm.
//
// We maintain a set of unresolved package/version ranges, and a list of resolved packages of a fixed
// version. In each step of the algorithm, we pull one unresolved package off the list, and:
//   1. if we are out of unresolved packages, we call the success callback.
//   2. else, enumerate all versions that we can try, trying the first.
//   3. if that fails, it'll call a failure callback, which tries the next.
//   4. if there is no next, call the parent failure callback.
//
// TODO -- fixup the above description, it sucks.

Resolver = function(deps, forceDeps) {
  this.deps = deps;
  this.forceDeps = forceDeps;
}

Resolver.prototype.resolve = function(fn) {
  var self = this;
  
  // clear conflicts out for reporting
  self.conflicts = {};
  
  // unresolved is a LIST of packages (the same package can be in there many times, with differing requirements)
  // resolved is a MAP (each package once)
  self.resolveStep(_.values(self.deps.basePackages), {}, function(err, packages) {
    if (!err) 
      self.deps.packages = packages;
      
    fn(err, self.conflicts);
  });
}

Resolver.prototype.resolveStep = function(unresolved, resolved, complete) {
  
  debug("resolveStep: unresolved count: " + unresolved.length + ', resolved count:' + _.values(resolved).length);
  
  // base case
  if (unresolved.length === 0)
    return complete(null, resolved);
  
  // pull the first package off the list
  var resolvingPkg = unresolved.shift();
  // try and resolve this package. If it fails, pass the error up the chain
  this.resolvePackage(resolvingPkg, unresolved, resolved, complete);
}

// add a package to resolved.
//   first we need to check if the package has already been resolved.
//     - if it has we need to ensure that a congruent version was added
//     - if a 'wrong' version was added, we need to remedy that.
//   otherwise: the tricky bit; the problem being that there are different versions 
//     we could potentially add. So we need to just try the first one and wait to be
//     told it was a mistake
Resolver.prototype.resolvePackage = function(current, unresolved, resolved, fn) {
  var self = this;
  
  debug('resolving ' + current.name)
  // first check to see if this package is already resolved
  var existing = resolved[current.name];
  if (existing) {
    debug('  existing version of ' + current.name + ' found')
    
    if (current.conflictsWith(existing)) {

      self.conflicts[current.name] = "[" + current.id() + "] conflicts with [" + existing.id() + "]";
      
      if (self.forceDeps)
        if (current.overrides(existing))
          self.conflicts[current.name] += "; overriding with [" + current.id() + "]";
        else
          self.conflicts[current.name] += "; keeping [" + existing.id() + "]";
      
      if (self.forceDeps && current.overrides(existing)) {
        // go back up the chain and tell the spot where this package was 
        // installed to replace itself with current
        return fn(current);
      } else if (! self.forceDeps) {
        var message = "Can't resolve dependencies! Use --force if you don't " +
                      "mrt taking a wild guess and running your app anway.";
        return fn({ message: message });
      }
    }
    
    self.resolveStep(unresolved, resolved, fn)
    
  } else {
    // TODO -- we don't need versioning code right now. We just try the latest version,
    // potentially overridden by a 'more' important source. 
    //   NOTE TO SELF: when doing versions; we grab the list of versions.
    //   try the first; if the error is with the version, we iterate; if we run out of versions,
    //   we callback with an unresolvable exception.
    
    // clone `unresolved` and `resolved` so they are at the right point if we come back
    self.resolveVersion(current, unresolved.slice(), _.extend({}, resolved), function(err, soln) {
      // if there's a problem, check if it was with this package
      if (err && err.name === current.name) {
        // try again with err (which is a replacement package)
        self.resolvePackage(err, unresolved, resolved, fn);
        
      } else {
        // the problem wasn't us, pass up the chain (or there's no problem)
        return fn(err, soln);
      }
    });
  }
}

// we are going to have a red hot go at using this version of this package. we need to:
//   a) add all of this version's dependencies to the unresolved pkgs
//   b) try to keep going, resolving the next package off the list
Resolver.prototype.resolveVersion = function(current, unresolved, resolved, fn) {
  var self = this;
  
  debug('resolving ' + current.toString());
  resolved[current.name] = current;
  // QN: is there any benefit in independently resolving current's dependencies? think about it...
  current.readDependencies(function() {
    unresolved = unresolved.concat(_.values(current.dependencies.basePackages))
    
    // we are done with this package (we hope). Go with the next
    self.resolveStep(unresolved, resolved, fn);
  });
}

Resolver.resolve = function(deps, forceDeps, fn) {
  new Resolver(deps, forceDeps).resolve(fn);
}

module.exports = Resolver;