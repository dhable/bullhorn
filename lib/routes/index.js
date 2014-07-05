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
    conf = require("../conf.js"),
    application = require("./application.js"),
    security = require("./security.js"),
    recipient = require("./recipient.js");


/**
 * Module based log interface.
 */
var log = require("../logger.js")("routes");


/**
 * Imports the route handler libraries grouped by their modules. Each ReST request is
 * satisfied by assembling the smaller handlers into chains that the inbound HTTP 
 * request is passed through.
 */
var authorize = security.authorize,
    generateAPIKey = security.generateAPIKey,
    updateAppKeyInfo = security.updateAppKeyInfo,
    deleteAPIKey = security.deleteAPIKey,
    returnKeyInfo = security.returnKeyInfo,
    translateExternalAppId = application.translateExternalAppId,
    loadApplication = application.loadApplication,
    createRecipient = recipient.createRecipient,
    loadRecipient = recipient.loadRecipient,
    loadAllRecipients = recipient.loadAllRecipients,
    returnRecipient = recipient.returnRecipient,
    returnAllRecipients = recipient.returnAllRecipients,
    updateRecipient = recipient.updateRecipient,
    deleteRecipient = recipient.deleteRecipient;


var oldBrowserRedirectTmpl = _.template(
   "<html>" +
   "<head><title>Page Moved</title></head>" +
   "<body>" +
   "<h1>This page has moved</h1>" +
   "<p>This page has moved to <a href='${newLocation}'>${newLocation}</a>.</p>" +
   "</body></html>");

var redirect = function(redirectTo, req, res, next) {
   var htmlPayload = oldBrowserRedirectTmpl({newLocation: redirectTo});

   res.writeHead(301, {
      "Content-Type": "text/html",
      "Content-Length": htmlPayload.length,
      "Location": redirectTo
   });

   res.write(htmlPayload);
   res.end();
   next(false);
};

var returnOk = function(req, res, next) {
   res.send(200);
   next(false);
};

var Null = returnOk;


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


   // Setup some custom hooks on various restify actions. These are used
   // for monitoring, redirecting and provide better error responses
   // so it doesn't look so much like restify.
   server.on("NotFound", _.partial(redirect, "http://dev.jetway.io"));


   // Create a new local storage object that can be used to pass values
   // between restify middleware functions.
   server.use(function(req, res, next) {
      if(_.has(req, "local")) {
         log.warn("restify request already contains a local object with values %j", req.local);
      }

      req.local = {};
      next();
   });

   server.post({path: "/applications/:appId/key", version: "1.0.0"},
      authorize, loadApplication, generateAPIKey, updateAppKeyInfo, returnKeyInfo);

   server.del({path: "/applications/:appId/key", version: "1.0.0"},
      authorize, loadApplication, deleteAPIKey, returnOk);

   server.get({path: "/applications/:appId/logs", version: "1.0.0"},
      authorize, Null);

   server.post({path: "/applications/:appId/recipients", version: "1.0.0"},
      authorize, translateExternalAppId, loadApplication, createRecipient, returnRecipient);

   server.get({path: "/applications/:appId/recipients", version: "1.0.0"},
      authorize, translateExternalAppId, loadApplication, loadAllRecipients, returnAllRecipients);

   server.get({path: "/applications/:appId/recipients/:recipientId", version: "1.0.0"},
      authorize, translateExternalAppId, loadApplication, loadRecipient, returnRecipient);

   server.put({path: "/applications/:appId/recipients/:recipientId", version: "1.0.0"},
      authorize, translateExternalAppId, loadApplication, loadRecipient, updateRecipient, returnRecipient);

   server.del({path: "/applications/:appId/recipients/:recipientId", version: "1.0.0"},
      authorize, translateExternalAppId, loadApplication, deleteRecipient, returnOk);

   server.post({path: "/applications/:appId/notifications", version: "1.0.0"},
      /*authorize,*/ function(req, res, next) { 
         console.log(req.body);
         next();
      }, Null);

   server.get({path: "/applications/:appId/notifications/:notificationId", version: "1.0.0"},
      authorize, Null);

   server.del({path: "/applications/:appId/notifications/:notificationId", version: "1.0.0"},
      authorize, Null);

   if(conf.get("env") == "dev") {
      log.info("bidning test console to API");
      server.get("/test-console", sendTestConsole);
   }
};
