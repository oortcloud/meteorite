# Meteorite

Installer & smart package manager for Meteor

## Summary

Meteorite makes life easier until Meteor core has it's own smart package installer

## Installation

    npm install -g meteorite

## How does it work?

Meteorite installs a utility called `mrt` that works just like `meteor` except when it runs it does a few extra things for you. When you use it to run your app:

  1) The first time it installs an app specific instance of `meteor`

  2) Then it installs the app's smart package dependencies which you specifiy in a file called `smart.json`
  
  3) If the app's smart packages have dependencies of their own (also defined in `smart.json`) they're installed, recursively.

  4) With everything installed the app's `meteor` instance takes over and runs your app. All of `meteor`'s subcommands are supported (e.g. `run`, `deploy`, etc). 

## Configuration

*Note: We only support git repositories right now. We plan to add the ability to specify a path to a local package also.*

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

## Example usage

See looks and works just like `meteor`!

    mrt run --port=8888
    
You can also *just* install everything listed in `smart.json` without running any underlying `meteor` command

    mrt install

## Contributing

See [Contributing](https://github.com/possibilities/meteorite/wiki/Contributing)
