var _ = require('underscore');
var path = require('path');
var spawn = require('child_process').spawn;
var fs = require('fs');
var wrench = require('wrench');
var Sync = require('sync');
var Repo = require('./repo');

Package = function(package) {
  _.extend(this, package);
  this.path = path.join(Meteor._meteoriteDir(), 'packages', this.name, this.repo.checkout, this.repo.head);
};

_.extend(Package.prototype, Repo);

module.exports = Package;
