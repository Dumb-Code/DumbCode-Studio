const withTM = require("next-transpile-modules")(["@dumbcode/shared"]);

module.exports = withTM({
  reactStrictMode: true,
  basePath: "/docs-from-studio",
});
