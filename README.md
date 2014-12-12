# Meteorite

*NOTE: As of [Meteor 0.9.0](https://www.meteor.com/blog/2014/08/26/meteor-090-new-packaging-system), Meteorite is no longer required! You can now install [Atmosphere packages](https://atmospherejs.com) directly via the `meteor` tool.*


Meteorite is a Meteor package installer.

It provides an easy way to install Meteor packages into your project from sources such as git and the filesystem. 

It also gives a (now deprecated) method of publishing and installing packages from the [Old Atmosphere Server](http://old-atmosphere.meteor.com). Please note that the latest and greatest packages are on the [Real Atmosphere Server](https://atmospherejs.com) and can be installed directly with Meteor.


## Installing Meteorite

Meteorite can be installed via [npm](https://npmjs.org/).

``` sh
$ npm install -g meteorite
```

### NOTE:
If your system requires root access to install global npm packages, make sure you use the `-H` flag:

``` sh
$ sudo -H npm install -g meteorite
```


### NOTES

- Meteor is not officially supported on windows; you can run it thanks to [Tom Wijman's excellent work](http://win.meteor.com). However, meteorite's git based approach runs counter to the MSI installation that's required to get it working. So meteorite *does not* work under windows right now. Pull Requests which change this would be gladly accepted! Also, see [this blog post](http://www.discovermeteor.com/2013/03/20/using-meteor-and-atmopshere-on-windows/) for some information about how to use it.

- You'll also need to ensure you have [git](http://git-scm.com) installed and available in your path. Also, you'll need to make sure that `mrt`'s install location (usually `/usr/local/bin/`) is on your path.


## Usage

### `smart.json`

List your packages in a `smart.json` file in the top level of the project. There are two (non-deprecated) ways to include packages:

```
{
  "packages": {
    "my:fork": {
      "git": "https://github.com/my/fork.git"
    },
    "local:version": {
      "path": "to/the/package/"
    }
  }
}
```


### `mrt install`

Install all packages listed in `smart.json` that aren't already installed on your machine. Use this command if you are working collaboratively and your colleagues install new packages (`smart.lock` changes).

### `mrt update`

Installs any available updates to the app's desired Meteor version and packages -- use this if a new version is available on git, for instance.


### `mrt link-package path/to/foo`

Links `packages/foo` to `path/to/foo` so that you can use a local version without changing `smart.json`. Useful for quick changes to a package you maintain when developing an application. 

Note that `mrt install` or `mrt` will _overwrite_ this link if you also have `foo` in your `smart.json` (which you probably will). This may change in the future.





## Options

Options can be passed at the very end of the command.

### `--verbose`

Log debug information to the console.

Example: `mrt add crypto-sha1 --verbose`

## Deprecated commands

As Meteorite now installs packages into the `packages/` directory, you can simply run `meteor` to start your app. You may need to run `mrt install` first.
You can run any meteor executable you like (e.g. from a checkout somewhere on your machine). 

### `mrt`

Works like `meteor`, but checks and installs the app's desired Meteor version and package dependencies before running the app. You may still want to use this, but it's no longer the official way to use Meteorite.

If however you want to use a forked version of Meteor in your project, you can still list it in your `smart.json`, and Meteorite will run it via `mrt`. (Of course you could just run it directly from a checkout too, which may be simpler).



### `mrt add <package>`

Works like `meteor add`, but if the package isn't one of Meteor's included packages, it installs it from [Old Atmosphere](https://old-atmosphere.meteor.com).

Unlike `meteor add`, only one package can be added at a time with `mrt add`.

``` sh
# Add the latest version of the moment package on Atmosphere.
$ mrt add moment
# Add a specific version of a package.
$ mrt add router --pkg-version 0.3.4
# Meteorite will install page.js too, because router depends on it.
```

Note the packages on the old site are only likely to work with Meteor < 0.9.0.

### `mrt remove <package>`

Similarly, removes a package from `smart.json`, and unlinks it from your project (as well as telling Meteor not to use it).


### Other commands

When Meteorite is executed for an app, it checks or installs the app's desired Meteor version, packages and dependencies, then does the required book-keeping (described below), and finally passes the command onto `meteor`.

## Permission woes?

It is *not* required that you run `sudo mrt`. If you do so, your home directory will pick up some root-owned files and you'll struggle to run `mrt` without `sudo` from then on. This isn't good.

To fix the problem, try cleaning up potentially "sudo-ed" files:

```bash
sudo mrt uninstall
sudo mrt uninstall --system
sudo chown -R `whoami` ~/.npm
```

If possible, try not to install Meteorite as root either. If you have permissions problems, make sure you install with `sudo -H npm install -g meteorite`. If you've installed without `-H`, your `~/.npm` directory will be owned by root and you should run the `chown` command above to fix it.



## How Meteorite works

Apps tell Meteorite the Meteor version and packages they want with a file called `smart.json` in their root directory. Meteorite will install those dependencies the next time it is executed within that app.

Meteorite writes to a `smart.lock` file in the app's root directory to track the exact versions of its dependencies, even when it's set up in a fresh environment. You should check the `smart.lock` file into your app's version control, to ensure that other developers are running the same versions of the dependencies. Any changes in `smart.json` take precendence over `smart.lock`. The `smart.lock` file is reset with the `mrt update` command.

### Example `smart.json`

The `meteor` property is not required: apps will depend on Meteor's master branch by default. You can specify `meteor.branch`, `meteor.tag` or `meteor.git` to use alternate branches, tags and forks respectively. Note that `meteor.git` expects an actual URL, use `ssh://git@github.com/meteor/meteor.git` instead of `git@github.com:meteor/meteor.git`.

``` json
{
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
    "branch-of-package": {
      "git": "https://github.com/EventedMind/iron-router.git",
      "branch": "dev"
    },
    "my-experiment": {
      "path": "/path/to/local/package"
    }
  }
}
```

## Bash Completion

Use Meteorite's bash completion by sourcing it in your .bashrc or .bash_profile.

Depending on where you installed Meteorite:

```bash
if [ -f /path/to/meteorite/completions/mrt.bash ]; then
  . /path/to/meteorite/completions/mrt.bash
fi
```

Alternatively, you can create a symbolic link under bash_completion.d:

```bash
ln -s /path/to/meteorite/completions/mrt.bash /path/to/bash_completion.d/mrt
```

## Running Meteorite In a Git Hook Script

If you encounter checkout errors while running `mrt install` or `mrt update` within a Git hook script, it is because `GIT_DIR` is set to an unexpected value when running within a hook. The solution is to temporarily unset it just before running the `mrt` command.

```bash
(unset GIT_DIR; mrt update)
```

## Contributing

Contributions to meteorite are very welcome! Please see the [Contribution Guide](https://github.com/oortcloud/meteorite/blob/master/CONTRIBUTING.md) for details.
