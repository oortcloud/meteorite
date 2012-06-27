var spawn = require('child_process').spawn;
var path = require('path');
var _ = require('underscore');
var Repo = require('./repo');

Meteor = function(meteor) {
  this._prepare(meteor);
  this.path = path.join(Meteor._meteoriteDir(), 'meteors', this.repo.checkout, this.repo.head);
};

_.extend(Meteor.prototype, Repo);

Meteor.prototype._prepare = function(meteor) {
  _.extend(this, meteor);

  var head = meteor.branch || meteor.ref || meteor.tag || 'master';
  var url = meteor.git || 'https://github.com/meteor/meteor.git';

  this.repo = {
    checkout: 'branch',
    head: head,
    url: url
  };
};

Meteor._meteoriteDir = function() {
  var homeDir = process.env.HOME;
  return path.join(homeDir, '.mrt');
};

module.exports = Meteor;
