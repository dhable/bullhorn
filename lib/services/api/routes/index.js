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
    application = require("./application.js"),
    security = require("./security.js"),
    recipient = require("./recipient.js"),
    notification = require("./notification.js");


/**
 * Module based log interface.
 */
var log = require("../../../logger.js")("routes");


/**
 * Imports the route handler libraries grouped by their modules. Each ReST request is
 * satisfied by assembling the smaller handlers into chains that the inbound HTTP 
 * request is passed through.
 */
var generateAPIKey = security.generateAPIKey,
    updateAppKeyInfo = security.updateAppKeyInfo,
    deleteAPIKey = security.deleteAPIKey,
    returnKeyInfo = security.returnKeyInfo,
    translateExternalAppId = application.translateExternalAppId,
    createRecipient = recipient.createRecipient,
    loadRecipient = recipient.loadRecipient,
    loadAllRecipients = recipient.loadAllRecipients,
    returnRecipient = recipient.returnRecipient,
    returnAllRecipients = recipient.returnAllRecipients,
    updateRecipient = recipient.updateRecipient,
    deleteRecipient = recipient.deleteRecipient,
    queueNotification = notification.queueNotification,
    returnNotification = notification.returnNotification;


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
  var common = require("./common.js")(conf),
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
   server.post({path: "/applications/:appId/key", version: "1.0.0"},
      common.authorize, common.loadApplication, generateAPIKey, updateAppKeyInfo, returnKeyInfo);

   server.del({path: "/applications/:appId/key", version: "1.0.0"},
      common.authorize, common.loadApplication, deleteAPIKey, common.emptyOKChainHandler);

   // module 2 - Application Module
   server.get({path: "/applications/:appId/logs", version: "1.0.0"},
      common.authorize, Null);

   // module 3 - Recipients Module
   server.post({path: "/applications/:appId/recipients", version: "1.0.0"},
      common.authorize, common.translateExternalAppId, common.loadApplication, createRecipient, returnRecipient);

   server.get({path: "/applications/:appId/recipients", version: "1.0.0"},
      common.authorize, common.translateExternalAppId, common.loadApplication, loadAllRecipients, returnAllRecipients);

   server.get({path: "/applications/:appId/recipients/:recipientId", version: "1.0.0"},
      common.authorize, common.translateExternalAppId, common.loadApplication, loadRecipient, returnRecipient);

   server.put({path: "/applications/:appId/recipients/:recipientId", version: "1.0.0"},
      common.authorize, common.translateExternalAppId, common.loadApplication, loadRecipient, updateRecipient, returnRecipient);

   server.del({path: "/applications/:appId/recipients/:recipientId", version: "1.0.0"},
      common.authorize, common.translateExternalAppId, common.loadApplication, deleteRecipient, common.emptyOKChainHandler);

   // Module 4 - Notifications Module
   server.post({path: "/applications/:appId/notifications", version: "1.0.0"},
      common.authorize, common.translateExternalAppId, common.loadApplication, queueNotification, returnNotification);


   server.get({path: "/applications/:appId/notifications/:notificationId", version: "1.0.0"},
      common.authorize, Null);

   server.del({path: "/applications/:appId/notifications/:notificationId", version: "1.0.0"},
      common.authorize, Null);


   // Module 5 - Testing Module
   if(conf.get("env") == "dev") {
      log.info("bidning test console to API");
      server.get("/test-console", sendTestConsole);
   }
};
