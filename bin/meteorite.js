#!/usr/bin/env node

var Installer = require('../lib/installer');

new Installer().run(function() {
  console.log('Intallation complete!');
});
