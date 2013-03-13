var _ = require('underscore');
var assert = require('assert');
var Meteorite = require('../../lib/meteorite');

describe('Package object', function() {
  var testAtmosPkg = function(beforeFn) {
    var thisPkg;
    before(function() {
      thisPkg = beforeFn()
    });
    
    it('should be equals() to the same package', function() {
      assert(thisPkg.equals(new Package('mrt-test-pkg1', {})));
    });
    
    it('should be equals() to a fetched version of the same package', function() {
      var fetched = new Package('mrt-test-pkg1', {});
      fetched.source = new GitSource('/', {git: 'foo.git'});
      assert(thisPkg.equals(fetched));
    });
    
    it('should not be equals() to a different package', function() {
      assert(!thisPkg.equals(new Package('mrt-test-pkg2', {})));
    });
    
    it('should not be equals() to a git package', function() {
      assert(!thisPkg.equals(new Package('mrt-test-pkg1', {git: 'foo.git'})));
    });
    
    it('should not be equals() to a local package', function() {
      assert(!thisPkg.equals(new Package('mrt-test-pkg1', {path: '/foo'})));
    });
  }
  
  describe('from atmosphere, unfetched', function() {
    testAtmosPkg(function() {
      return new Package('mrt-test-pkg1', {})
    });
  });
  
  describe('from atmosphere, fetched', function() {
    testAtmosPkg(function() {
      var thisPkg = new Package('mrt-test-pkg1', {})
      thisPkg.source = new GitSource('/', {git: 'foo.git'});
      return thisPkg;
    });
  });
  
  // TODO -- commits... ?
  describe('from git', function() {
    var thisPkg;
    before(function() {
      thisPkg = new Package('mrt-test-pkg1', {git: 'foo.git'});
    });
    
    it('should be equals() to the same package', function() {
      assert(thisPkg.equals(new Package('mrt-test-pkg1', {git: 'foo.git'})));
    });

    it('should not be equals() to the same package from a different source', function() {
      assert(!thisPkg.equals(new Package('mrt-test-pkg1', {git: 'foo-2.git'})));
    });
    
    it('should not be equals() to a different package', function() {
      assert(!thisPkg.equals(new Package('mrt-test-pkg2', {git: 'foo2.git'})));
    });
    
    it('should not be equals() to an atmos package', function() {
      assert(!thisPkg.equals(new Package('mrt-test-pkg1', {})));
    });
    
    it('should not be equals() to a local package', function() {
      assert(!thisPkg.equals(new Package('mrt-test-pkg1', {path: '/foo'})));
    });
  });
  
  var testLocalPkg = function(beforeFn) {
    var thisPkg;
    before(function() {
      thisPkg = beforeFn()
    });
    
    it('should be equals() to a resolved versions of the same package', function() {
      assert(thisPkg.equals(new Package('mrt-test-pkg1', {
        path: '/path/to/mrt-test-pkg1'
      })));
    });

    it('should be equals() to an unresolved version of the package', function() {
      assert(thisPkg.equals(new Package('mrt-test-pkg1', {
        path: '../mrt-test-pkg1', root: '/path/to/somewhere'
      })));
    });

    it('should not be equals() to an resolved package from a different path', function() {
      assert(!thisPkg.equals(new Package('mrt-test-pkg1', {
        path: '/absolute/other/path/to/mrt-test-pkg1', specifiedPath: '../other/path/to/mrt-test-pkg1'
      })));
    });
    
    it('should not be equals() to an unresolved package from a different path', function() {
      assert(!thisPkg.equals(new Package('mrt-test-pkg1', {
        path: '../other/path/to/mrt-test-pkg1'
      })));
    });
    
    it('should not be equals() to a different package', function() {
      assert(!thisPkg.equals(new Package('mrt-test-pkg2', {path: '/something/else'})));
    });
    
    it('should not be equals() to an atmos package', function() {
      assert(!thisPkg.equals(new Package('mrt-test-pkg1', {})));
    });
    
    it('should not be equals() to a git package', function() {
      assert(!thisPkg.equals(new Package('mrt-test-pkg1', {git: 'foo.git'})));
    });
    
    it('should conflictsWith() a local pacakge with a different page', function() {
      // assert(thisPkg.conflictsWith(new Package('mrt-test-pkg1', {path: '/a/different/path'})));
    });
    
    it('should not conflictsWith() a local pacakge with the same page', function() {
      assert(!thisPkg.conflictsWith(new Package('mrt-test-pkg1', {path: thisPkg.source.path})));
    });
  };
  
  describe('from a resolved path', function() {
    testLocalPkg(function() {
      return new Package('mrt-test-pkg1', {
        path: '/path/to/mrt-test-pkg1'
      });
    });
  });

  describe('from an unresolved path', function() {
    testLocalPkg(function() {
      return new Package('mrt-test-pkg1', {
        path: '../mrt-test-pkg1', root: '/path/to/somewhere'
      });
    });
  });
  
});
