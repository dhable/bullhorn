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
    _ = require("lodash"),
    conf = require("../conf.js");


/**
 * Module based log interface.
 */
var log = require("../logger.js")("routes");


/**
 * Imports the route handler libraries grouped by their modules. Each ReST request is
 * satisfied by assembling the smaller handlers into chains that the inbound HTTP 
 * request is passed through.
 */
var App = require("./application.js");


/**
 * Restify handler that encapsulates all the logic for serving up 
 * the test-console page to the client.
 */
var sendTestConsole = function(req, res, next) {
   var htmlPath = path.join(__dirname, "..", "..", "public", "test-console.html");
   fs.createReadStream(htmlPath).pipe(res);
};


/**
 * This function accepts a restify server, binding various ReST
 * endpoint routes to concrete functions.
 *
 * Bind should only be called once per server pair implementation.
 * Since bind is a setup task, it's ok to use blocking calls in
 * this method or any method called from bind.
 */
exports.bind = function(server) {
   log.info("binding ReST endpoints to restify handlers");

   server.get({path: "/applications/:appId/key", version: "1.0.0"}, 
      App.retrieveFromDB);

   if(conf.get("env") == "dev") {
      log.info("bidning test console to API");
      server.get("/test-console", sendTestConsole);
   }
};
