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
 * This function accepts a restify server and socket.io server,
 * binding various ReST endpoint routes and event handlers to
 * concrete functions.
 *
 * Bind should only be called once per server pair implementation.
 * Since bind is a setup task, it's ok to use blocking calls in
 * this method or any method called from bind.
 */
exports.bind = function(restifyServer, ioServer) {
  log.info("binding ReST endpoints to restify handlers");
  require("./health.js").bind(restifyServer);
  require("./messages.js").bind(restifyServer);
  require("./ops.js").bind(restifyServer);
  require("./stats.js").bind(restifyServer);

  log.info("binding socket.io events to event handlers");
  // TODO: add socket.io event handlers here
};