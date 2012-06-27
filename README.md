# Meteorite

Installer & smart package manager for Meteor

*Note: [Most of this works poorly or not at all, stay tuned](http://tom.preston-werner.com/2010/08/23/readme-driven-development.html) (;*

## Summary

Until meteor core comes up with their own smart package install solution meteorite is here to make life easier.

Meteorite installs a command line utility called `mrt` that works just like `meteor` except it

  * Installs a project specific copy of meteor

  * Installs smart package dependencies listed in `smart.json` in the project's `meteor/packages`

  * Runs the meteor command using the project specific copy of meteor (duh!)

  * Includes a subcommand `mrt install` that allows you to do the installation prior to runtime

## Installation

    npm install -g meteorite

## Get help

See usage for all commands

    mrt --help

## Configuration

A sample `smart.json`

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

Install everything in `depend.js` and run a project-specific copy of `meteor` (*run* is the default and therefore optional)

    mrt run
    
Just install everything listed in `depend.js`

    mrt install

Show the path to the project specific copy of `meteor`

    mrt home

Use `--impotent` to bypass all meteorite love

    mrt run --impotent
