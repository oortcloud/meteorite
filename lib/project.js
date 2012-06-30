var path = require('path');
var fs = require('fs');
var _ = require('underscore');
_.str = require('underscore.string');
var Packages = require('./packages');
var Config = require('./config');
var Meteor = require('./meteor');
var Meteorite = require('./meteorite');

_.mixin(_.str.exports());

Project = function() {
  this._prepareFS();

  this.config = new Config(process.cwd());
  this.packages = new Packages(this.config.packages);
  this.meteor = new Meteor(this.config.meteor);
};

Project.prototype.fetch = function(fn) {
  var self = this;
  console.info('Packages :: Fetch');
  self.packages.fetch(function() {
    self.meteor.repo.fetch(fn);
  });
};

Project.prototype.install = function(fn) {
  var self = this;
  console.info('Project :: Fetch');
  self.fetch(function() {
    console.info('Meteor :: Install App');
    self.meteor.installApp(function() {
      console.info('Packages :: Install');
      self.packages.install(self.meteor);
      fn.call(self);
    });
  });
};

Project.prototype._prepareFS = function() {
  var root = Meteorite.root();
  if (!path.existsSync(root))
    fs.mkdir(root);
};

module.exports = Project;
