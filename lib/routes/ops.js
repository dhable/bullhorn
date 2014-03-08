/**
 * A set of ReSTful APIs that allow an operations person to query the
 * state of the server.
 *
 * @module routes/ops
 */
var _ = require("lodash");


var appendInfo = function(info, req, res, next) {
  var existingInfo = req.context.opinfo || {};
  req.context.opinfo = _.assign(existingInfo, info);
  return next();
};


var getVersionInfo = _.partial(appendInfo, {
  node: process.versions
});


var getEnvironment = _.partial(appendInfo, {
    argv: process.argv,
    env: process.env
});


var getProcess = _.partial(appendInfo, {
    pid: process.pid,
    cmd: process.argv.join(" "),
    uptime: process.uptime(),
    memory: process.memoryUsage()
});


var done = function(req, res, next) {
  var info = req.context.opinfo;
  if(info) {
    res.send(info);
  } else {
    res.send(500, "Failed to determine the infomation requested.");
  }
};


/**
 * Public method from the route module that defines the URL patterns
 * and binds them to the functional flow for processing the request.
 *
 * @method bind
 */
exports.bind = function(restifyServer) {
  restifyServer.get({version: "1.0.0", path: "/ops/version"}, getVersionInfo, done);

  restifyServer.get({version: "1.0.0", path: "/ops/env"}, getEnvironment, done);

  restifyServer.get({version: "1.0.0", path: "/ops/process"}, getProcess, done);

  restifyServer.get({version: "1.0.0", path: "/ops"}, getProcess, getVersionInfo, getEnvironment, done);
};
