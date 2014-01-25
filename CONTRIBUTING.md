# Contributing to Meteorite

Do the normal fork, patch, pull-request dance. If you don't know what that means or need any help, let us know.

## Troubleshooting

Sometimes git can get into broken states if weird things happen and the error messages you get as a result can be confusing. 

So before reporting errors, please first try cleaning up all of Meteorite's files and starting again (in your app's dir):

```js
  mrt uninstall
  mrt uninstall --system
  mrt
```

If you are seeing permission errors (e.g. `EACCESS`, talk of needing to be Administrator) please read: https://github.com/oortcloud/meteorite#permission-woes

## Troubleshooting part 2, ADVANCED

If you are still seeing problems after trying the above, or you want to figure out why you need to do it, please remember that Meteorite is at heart a very simple script that _isn't really doing much_. 

Remember that when you `mrt install` or just run `mrt`, Meteorite is doing the following:

1. Inspecting your `smart.json` to figure out what packages need to be installed.
2. Cloning them into `~/.meteorite/sources/<AUTHOR>/<REPO_NAME>`, checking out the right branch, git pulling.
3. Copying the files into `~/.meteorite/packages/<NAME>/<AUTHOR>/<REPO_NAME>/<COMMIT>/`
4. Symlinking packages from `packages/` to that location.
5. [Possibly] Running Meteor from a git checkout (similarly, in `~/.meteorite/meteors/<NAME>/<AUTHOR>/<REPO_NAME>/<COMMIT>/`).

You can inspect `smart.lock` for some insights too.

Helpful debugging you can do is:

1. Manually doing the same, seeing if you see the same error.
2. Digging around in `~/.meteorite` and seeing if git checkouts have gotten into a broken state.

Meteorite is fairly brittle as it calls out to commandline git all the time, and problems can can sometime get missed. We appreciate you going the extra mile.


## How to develop

Use `npm link` to install your forked copy of Meteorite, then do something to make it more awesome.


## Testing

We have a pretty good start at an acceptance test suite but it could be a lot better. Help us fix this!

### 1. Setup

To run meteorite's test suite, you'll need a local atmosphere instance and a bit of setup for the meteorite dependencies.  Here are the steps to get those set up:

```sh
$ cd ~/tmp
$ git clone https://github.com/oortcloud/atmosphere.git
$ cd atmosphere/app
$ mrt --port 3333

# in a separate terminal...

$ cd ~/tmp
$ git clone git@github.com:oortcloud/meteorite.git
$ cd meteorite
$ git submodule update --init
$ npm install
```

### 2. Git path

You'll need to ensure you have a git executable available at your PATH so `which git` can find it.

You can find out where your current git command is being executed like this:

```sh
$ which git
```


### 3. Create test user on local Atmosphere instance

The tests expect a local version of atmosphere running on port 3333, with a user 'test' with password 'testtest'.  So now that the local atmosphere app is running, point your browser to http://localhost:3333/ and sign up with the following credentials:

  * Username: test
  * Password: testtest


### 4. Running tests

Once the above setup steps are complete, here's how you run the meteorite test suite:

``` sh
$ npm test
# or
$ mocha spec/unit spec/acceptance -t 240000 -R spec
```

### 5. Refreshing the test cache (as needed)

Because Meteorite downloads Git repositories, we cache the results so the test suite will run fast. It will be slow the first time.

When the related repositories change, you'll need to flush the cache.

``` sh
$ npm run-script flushcache
```



### Test troubleshooting

#### Error: timeout of 240000ms exceeded

If you get a timeout after the "Ensuring local atmosphere is running with the right packages" message, then it means you haven't started your local atmosphere app yet or its not running on port 3333.  

`$ mrt --port 3333`
  
```sh
$ npm test

> meteorite@0.7.1 test /Users/alanning/tmp/meteorite
> mocha spec/unit spec/acceptance -t 240000 -R spec



Preparing..
  Ensuring we have the dev bundle for system meteor
  Ensuring local atmosphere is running with the right packages
  1) "before all" hook

  0 passing (4m)
  1 failing

  1)  "before all" hook:
     Error: timeout of 240000ms exceeded
      at null.<anonymous> (/Users/alanning/tmp/meteorite/node_modules/mocha/lib/runnable.js:175:14)
      at Timer.listOnTimeout [as ontimeout] (timers.js:110:15)



npm ERR! weird error 1
npm ERR! not ok code 0
```

#### Error: Ensure you've added the test user (with password testtest) to your local atmosphere server

This means the local atmosphere app is running but the test user hasn't been created yet.  Point your browser to `http://localhost:3333/` and signup with these credentials:

  * Username: test
  * Password: testtest


#### Error: Problem finding package mrt-test-pkg1 ...or... Subcommand search does not exist

This means that your meteorite version is out of date.  Do an npm uninstall and reinstall like so:

```sh
$ npm uninstall -g meteorite
$ npm install -g meteorite
```

Note: If your system requires root access to install global npm packages, make sure you use the -H flag:

```sh
$ sudo -H npm uninstall -g meteorite
$ sudo -H npm install -g meteorite
```


### Todo

Figure out work-arounds for the following issues, using a patched version of mocha if we have to.

* Can't use mocha's recursive option because it breaks trying to process files in the test apps as test files.
* Can't seem to use `--watch`.
