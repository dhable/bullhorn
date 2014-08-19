/**
 * The routes package abstracts all of the ReST routes and
 * socket I/O event handlers. Lower level code should only
 * need to bind to the routes package as a whole instead
 * of individual routes.
 *
 * @module routes
 */
var fs = require("fs"),
    path = require("path"),
    _ = require("lodash");


/**
 * Module based log interface.
 */
var log = require("../../../logger.js")("routes");


/**
 * This function accepts a restify server, binding various ReST
 * endpoint routes to concrete functions.
 *
 * Bind should only be called once per server pair implementation.
 * Since bind is a setup task, it's ok to use blocking calls in
 * this method or any method called from bind.
 */
exports.bind = function(conf, server) {
  var common = require("./common.js")(log, conf),
      Null = common.emptyOKChainHandler;

   log.info("binding ReST endpoints to restify handlers");

   // Setup some custom hooks on various restify actions. These are used
   // for monitoring, redirecting and provide better error responses
   // so it doesn't look so much like restify.
   server.on("NotFound", common.redirect("http://dev.jetway.io"));

   // Create a new local storage object that can be used to pass values
   // between restify middleware functions.
   server.use(common.requestLocalStorage);
   
   // Load each of the API modules into the server.
   require("./domain.js").init(server, log, conf);
   require("./profile.js").init(server, log, conf);
   require("./notification.js").init(server, log, conf);
};
