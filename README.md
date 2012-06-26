# Meteorite

Installer & smart package manager for Meteor

*Note: [Most of this works poorly or not at all, stay tuned](http://tom.preston-werner.com/2010/08/23/readme-driven-development.html) (; *

## Summary

Until meteor core comes up with their own smart package install solution meteorite is here to make life easier. You specify dependencies in your project app/smart-package with JSON in a file called `depend.js`. When `meteorite` runs it launches a project-specific copy of `meteor` with all required smart packages installed. `meteorite` takes a `--system` flag for running/installing in the system `meteor` found in your path.

## Installation

    npm install -g meteorite

## Configuration

A sample `depend.js`

    {
      "meteor": {
        "branch": "devel"
      },
      "demostrap": {
        "git": "https://github.com/possibilities/meteor-demostrap.git",
        "tag": "v0.0.1"
      }
    }

## Usage

Get inline help

    meteorite --help

Install everything in `depend.js` and run a project-specific copy of `meteor` (*run* is the default and therefore optional)

    meteorite run
    
Just install everything listed in `depend.js`

    meteorite install

Show the path to the project specific copy of `meteor`

    meteorite home

If for some reason you want to use your system `meteor` installation do this:

    meteorite run --system
    meteorite install --system

You can include `meteor` as a dependency if you want to specify a version, ref, branch or tag. Otherwise the master branch (latest release) will be used.
