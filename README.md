# Meteorite

*Making Meteor devs happy since 2012*

## What is it?

A Meteor installer, and smart-package manager wrapped around the meteor command line interface. (Inspired by gem, bundler & rvm)

## How do I use it?

At the heart of Meteorite is a command line tool is called `mrt`. It wraps the `meteor` command and for the most part you use it just like you're using `meteor`. Let's say I'm building a new app and I'd like to develop against Meteor's development branch:

    mrt create cool-app --branch devel

Meteorite assumes `master` branch in most places so you don't always have to specify this. `mrt create` also supports specifying meteor by `--tag` or `--ref`.

To run an app use `mrt run` (or simply `mrt`):

    mrt run --port 2222

The charm of `mrt run` is that it installs the correct version of `meteor` and your app's smart package dependencies and runs your app in that context. `mrt` determines the correct version of `meteor` and smart package dependences by looking for a file called `smart.json` in the root of your app. A simple app's `smart.json` might look like this:

    {
      "meteor": {
        "branch": "devel"
      },
      "packages": {
        "moment": "1.7.0",
        "fork-me": {
          "version": "0.0.1"
        },
        "cool-tool": {
          "git": "https://github.com/possibilities/cool-tool.git",
          "tag": "v0.0.2"
        },
        "another-tool": {
          "git": "https://github.com/possibilities/another-tool.git"
        },
        "test-package": {
          "path": "/path/to/local/package"
        }
      }
    }

Interesting things that might not be obvious

  * The `meteor` specification is not required. Meteor's public repo checked out to the master branch is the default. You can specify `meteor.branch` and `meteor.git` to use alternate branches and forks respectively.

  * `moment` and `fork-me` packages are grabbed from [the central repo](https://atmosphere.meteor.com). Notice also that they both specify the version but `moment`'s specification is more terse.

  * The smart package author doesn't have to do anything except make the repo available. `mrt` will look for `package.js` in the repo and install it for you in the app specific meteor installation
  
  * If the smart package has it's own dependencies and the author wants to be awesome they can include a `smart.json` listing the package's own dependencies and everything will get sorted out by `mrt` (i.e. smart package dependencies will be installed recursively).

  * The first time `mrt` is run for an app it writes out a file called `smart.lock` which it uses on subsequent runs to make sure the app is using the correct versions of each dependency even when it's set up in a fresh environment. Generally you'll commit `smart.lock` into your repo each time it changes so that any developer who clones your app will be running the correct versions. If you change a version in `smart.json` it takes precedence over `smart.lock`.

  * `test-package` is setup to run from a local path. This is useful for developing smart packages for Meteor with Meteorite against a running app.

If you just want to *warm up* your app you can do the install only without running any underlying `meteor` command with `mrt install`.

Additionally you can *blow away* `smart.lock` and get everything to update using `mrt update` (`mrt update PACKAGE_NAME` coming *eventually*).

## Installation

    npm install -g meteorite

## How does it work?

When you run your app with `mrt`:

  1) It installs an app specific instance of `meteor`

  2) Installs the app's smart package dependencies specified in `smart.json`
  
  3) If the app's smart packages have dependencies of their own (also defined in `smart.json`) they're installed, recursively

  4) A `smart.lock` file is written to the project's root dir

  5) With everything installed the app's `meteor` instance takes over and runs your app. All of `meteor`'s subcommands are supported (e.g. `run`, `add`, `deploy`, `bundle`, etc).

## Meteorite's `add` subcommand

Meteorite's `mrt add <package-name>` subcommand wrap's Meteor's `add` command but does the additional work to fetch the meta data from [the central repo](https://atmosphere.meteor.com), fetching the package and installing it in the app.

Add the latest version of a package

    mrt add moment

Of if you want to specify a specific version

    mrt add moment --version 1.6.2

*Currently, unlike Meteor's `add` subcommand, you can only specify one package at a time.*

## Contributing

See [Contributing](https://github.com/possibilities/meteorite/wiki/Contributing)
