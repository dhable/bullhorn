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
    conf = require("../conf.js"),
    logger = require("../logger.js");


var log = logger("routes");


var loadApplication = require("./application.js").loadApplication;


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
      loadApplication);

   if(conf.get("env") == "dev") {
      log.info("bidning test console to API");
      server.get("/test-console", sendTestConsole);
   }
};
