Package.describe({
  summary: "mrt test package 1 v0.2.0"
});

Package.on_use(function (api) {
  api.add_files('server.js', 'server');
});
