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
   
   // module 1 - API Key Module
   require("./security.js").init(server, log, conf);
   
   // module 2 - Application Module
   server.get({path: "/applications/:appId/logs", version: "1.0.0"},
      common.authorize, Null);

   // module 3 - Recipients Module
   require("./recipient.js").init(server, log, conf);

   // Module 4 - Notifications Module
   require("./notification.js").init(server, log, conf);

   // Module 5 - Testing Module
   if(conf.get("env") == "dev") {
      log.info("bidning test console to API");
      server.get("/test-console", sendTestConsole);
   }
};
