# Meteorite

Meteorite is a Meteor version manager and package manager. It provides an easy way to install packages from the [Atmosphere package repository](https://atmosphere.meteor.com/). Meteorite provides the `mrt` command that wraps the `meteor` command, and can be used in its place.

``` sh
# Create an app based on Meteor's devel branch.
$ mrt create my-app --branch devel
$ cd my-app
# Install an Atmosphere package, recursively fetching dependencies.
$ mrt add router
# Check for and install any updates, and run the app.
$ mrt
```

## Installing Meteorite

Meteorite can be installed via [npm](https://npmjs.org/).

``` sh
$ sudo npm install -g meteorite
```

**Note:** Meteorite does not work on Ubuntu 12.04's default Node.js v0.6 ([issue #67](https://github.com/oortcloud/meteorite/issues/67)). To fix this, install a recent version of Node.js via [this PPA](https://launchpad.net/~chris-lea/+archive/node.js/) or by compiling from source.

## Usage

### `mrt create <name>`

Works like `meteor create`, but you can specify the desired branch, tag or reference of [Meteor's git repository](https://github.com/meteor/meteor) that the app should be based on.

``` sh
# By default, apps are based on Meteor's master branch.
$ mrt create cool-app
# You can create apps based on a branch of Meteor's repo.
$ mrt create risky-app --branch devel
# Or, on a tag (such as version numbers).
$ mrt create safe-app --tag v0.5.4
# Or, or on a commit.
$ mrt create choosy-app --ref a9a717
```

### `mrt add <package>`

Works like `meteor add`, but if the package isn't one of Meteor's included packages, it installs it from [Atmosphere](https://atmosphere.meteor.com).

Unlike `meteor add`, only one package can be added at a time with `mrt add`.

``` sh
# Add the latest version of the moment package on Atmosphere.
$ mrt add moment
# Add a specific version of a package.
$ mrt add router --version 0.3.4
# Meteorite will install page.js too, because router depends on it.
```

### `mrt run`

Works like `meteor run`, but checks and installs the app's desired Meteor version and package dependencies before running the app.

### `mrt update`

Installs any available updates to the app's desired Meteor version and packages.

### Other commands

When Meteorite is executed for an app, it checks or installs the app's desired Meteor version, packages and dependencies, then does the required book-keeping (described below), and finally passes the command onto `meteor`.

However, these checks takes time to send requests to remote servers. It only really makes sense to check the app's dependencies when running the `create`, `run`, `add` or `update` commands. For other commands, there's no need. Therefore, you'll likely want to stick with using `meteor` other commands like `list`, `bundle` or `deploy`.

## How Meteorite works

Apps tell Meteorite the Meteor version and packages they want with a file called `smart.json` in their root directory. Meteorite will install those dependencies the next time it is executed within that app.

Meteorite writes to a `smart.lock` file in the app's root directory to track the exact versions of its dependencies, even when it's set up in a fresh environment. You should check the `smart.lock` file into your app's version control, to ensure that other developers are running the same versions of the dependencies. Any changes in `smart.json` take precendency over `smart.lock`. The `smart.lock` file is reset with the `mrt update` command.

### Example `smart.json`

The `meteor` property is not required: apps will depend on Meteor's master branch by default. You can specify `meteor.branch`, `meteor.tag` or `meteor.git` to use alternate branches, tags and forks respectively.

``` json
{
  "meteor": {
    "tag": "v0.5.4"
  },
  "packages": {
    "moment": {},
    "router": "0.3.4",
    "roles": {
      "version": "1.0.1"
    },
    "accounts-persona": {
      "git": "https://github.com/vladikoff/meteor-accounts-persona"
    },
    "normalize.css": {
      "git": "https://github.com/rithis/meteor-normalize.css",
      "tag": "v2.0.1"
    },
    "my-experiment": {
      "path": "/path/to/local/package"
    }
  }
}
```

## Writing Meteorite packages

Meteorite packages include a `smart.json` file in their root directory to provide information about the package, and to list their dependencies. For an example, see [Meteor Router's `smart.json`](https://github.com/tmeasday/meteor-router/blob/master/smart.json).

Meteorite packages also include a `package.js` file in their root directory to tell Meteorite how it should be installed. For an example, see [Meteor Roles' `package.js`](https://github.com/alanning/meteor-roles/blob/master/roles/package.js).

See [Atmosphere's documentation on writing packages](https://atmosphere.meteor.com/wtf/package) for more information.

## Contributing

See [Contributing](https://github.com/oortcloud/meteorite/wiki/Contributing)
