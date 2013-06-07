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

### Local Atmosphere instance

Make sure you have a local Atmosphere instance running on port 3333. We use it to speed the tests up, but the tests won't output a helpful message if the Atmosphere instance isn't there. :disappointed:

### Running tests

``` sh
$ npm test
# or
$ mocha spec/unit spec/acceptance -t 240000 -R spec
```

### Refreshing the test cache

Because Meteorite downloads Git repositories, we cache the results so the test suite will run fast. It will be slow the first time.

When the related repositories change, you'll need to flush the cache.

``` sh
$ npm run-script flushcache
```

### Todo

Figure out work-arounds for the following issues, using a patched version of mocha if we have to.

* Can't use mocha's recursive option because it breaks trying to process files in the test apps as test files.
* Can't seem to use `--watch`.
