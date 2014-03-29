/**
 * A set of ReSTful APIs that allow an operations person to query the
 * state of the server.
 *
 * @module routes/ops
 */
var _ = require("lodash"),
    async = require("async"),
    drains = require("../drains");



/**
 * Queries the current environment and returns the environment version
 * and settings.
 */
var assembleServerInfo = function(req, res, next) {
  res.json({
    bullhornVersion: "0.1.0",
    cmd: process.argv.join(" "),
    nodeVersion: process.versions,
    env: process.env
  });

  return next();
};


/**
 * Queries the current process and returns process information that are
 * true at the current moment in time.
 */
var assembleTopInfo = function(req, res, next) {
  res.json({
    cmd: process.argv.join(" "),
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });

  return next();
};


/**
 * Public method from the route module that defines the URL patterns
 * and binds them to the functional flow for processing the request.
 *
 * @method bind
 */
exports.bind = function(restifyServer) {
  restifyServer.get({version: "0.1.0", path: "/ops/info"}, assembleServerInfo);

  restifyServer.get({version: "0.1.0", path: "/ops/top"}, assembleTopInfo);
};
