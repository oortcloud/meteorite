var assert = require('assert');
var fs = require('fs');
var _ = require('underscore');
var mrt = require('./helpers');
var Meteorite = require('../../lib/meteorite');

describe('mrt run', function(){
  beforeEach(function(done) {
    mrt.uninstall(done);
  });

  describe('invoked in a non-meteorite project directory', function(done){
    it("should display a message about not being in a meteor project dir", function(done){
      this.timeout(50000); // TEMP

      mrt.invoke('run', 'empty-dir', {
        expect: "You're not in a Meteor project directory"
      }, done);
    })
  });

});
