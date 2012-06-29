# Meteorite

Installer & smart package manager for Meteor

## Summary

Until meteor core comes up with their own smart package install solution meteorite is here to make life easier.

Meteorite installs a command line utility called `mrt` that works just like `meteor` except it

  * Installs a project specific instance of meteor

  * Installs smart package dependencies listed in `smart.json` in the project's meteor instance

  * Runs the `meteor` command using the project's meteor instance. You can use the `run`, `deploy`, `update`, `add`, `list`, `remove`, `bundle` and `reset` subcommands.

  * Includes a subcommand `mrt install` that allows runs the installation prior to runtime

## Installation

    npm install -g meteorite

## Get help

TODO See usage for all commands

    mrt --help

## Configuration

A sample `smart.json`

    {
      "meteor": {
        "branch": "devel"
      },
      "packages": {
        "simple-secure": {
          "git": "https://github.com/possibilities/simple-secure.git",
          "branch": "experimental"
        },
        "demostrap": {
          "git": "https://github.com/possibilities/meteor-demostrap.git",
          "tag": "v0.0.1"
        }
      }
    }

Any dependency listed without specifying a branch, tag or ref will use the repo's master branch. If `meteor` is not specified at all the latest release will be used.

## Usage

Install everything in `smart.json` and run a project-specific copy of `meteor` (*run* is the default and therefore optional)

    mrt run
    
Just install everything listed in `smart.json`

    mrt install

Show the path to the project specific copy of `meteor`

    mrt home
