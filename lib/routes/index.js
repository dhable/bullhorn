/**
 * The routes package abstracts all of the ReST routes and
 * socket I/O event handlers. Lower level code should only
 * need to bind to the routes package as a whole instead
 * of individual routes.
 *
 * @module routes
 */

var logger = require("../logger.js"),
    log = logger("routes");


/**
 * This function accepts a restify server, binding various ReST
 * endpoint routes to concrete functions.
 *
 * Bind should only be called once per server pair implementation.
 * Since bind is a setup task, it's ok to use blocking calls in
 * this method or any method called from bind.
 */
exports.bind = function(restifyServer) {
  log.info("binding ReST endpoints to restify handlers");
  require("./health.js").bind(restifyServer);
  require("./notifications.js").bind(restifyServer);
  require("./ops.js").bind(restifyServer);
};
