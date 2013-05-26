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
