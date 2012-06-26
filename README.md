# Meteorite

Installer & smart package manager for Meteor

*Note: [Most of this works poorly or not at all, stay tuned](http://tom.preston-werner.com/2010/08/23/readme-driven-development.html) (; *

## Summary

Until meteor core comes up with their own smart package install solution meteorite is here to make life easier. You specify dependencies in your project app/smart-package with JSON in a file called `depend.json`. When `meteorite` runs it launches a project-specific copy of `meteor` with all required smart packages installed.

## Installation

    npm install -g meteorite

## Configuration

A sample `depend.json`

    {
      "meteor": {
        "branch": "devel"
      },
      "demostrap": {
        "git": "https://github.com/possibilities/meteor-demostrap.git",
        "tag": "v0.0.1"
      }
    }

Any dependency listed without specifying a branch, tag or ref will use the repo's master branch. If `meteor` is not specified at all the latest release will be used.

## Usage

See usage for all commands

    meteorite --help

Install everything in `depend.js` and run a project-specific copy of `meteor` (*run* is the default and therefore optional)

    meteorite run
    
Just install everything listed in `depend.js`

    meteorite install

Show the path to the project specific copy of `meteor`

    meteorite home
