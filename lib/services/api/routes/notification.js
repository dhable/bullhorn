/**
 * Contains all of the notification API definitions.
 *
 * @module services.api.routes.notifications
 */
var uuid = require("node-uuid"),
    restify = require("restify"),
    amqplib = require("amqplib");


/**
 * Restify handler that enqueues the notification message for processing
 * later on. This method needs to be partial invoked so the log parameter
 * can be bound to the application log instance.
 */
var queueNotification = function(log, req, res, next) {
   log.info("inside queueNotification");

   var id = uuid.v1(),
       payload = JSON.stringify({
      appId: req.local.app.id,
      messageGuid: id,
      to: req.body.to,
      subject: "Test Subject",
      body: req.body.msg,
      domain: req.body.domain
   });

   queueConn.createChannel()
            .then(function(channel) {
               channel.assertQueue("notification");
               channel.sendToQueue("notification", new Buffer(payload));
               req.local.messageGuid = id;
               next();
            })
            .then(null, function(err) {
               this.log.error("failed to queue notification message - %s", err.message);
               next(new restify.InternalServerError());
            });
};


/**
 * Restify handler that returns the status of the new notification 
 * that was just added to the queue.
 */
var returnNewNotification = function(req, res, next) {
   res.json(202, {
      notification: req.local.messageGuid
   });

   next(false);
};


/**
 * Initalizes a restify server with all of the notification specific endpoints
 * and bind those endpoints to a series of handler functions.
 *
 * @param server The restify server instance to use for endpoint initalization.
 * @param log The application log instance.
 * @param conf The application configuration instance.
 */
exports.init = function(server, log, conf) {
   var common = require("./common.js")(log, conf);

   amqplib.connect(conf.get("pigeon.queue.broker"))
      .then(function(connection) {

         server.post({path: "/applications/:appId/notifications", version: "1.0.0"},
            common.authorize, common.translateExternalAppId, common.loadApplication, _.partial(queueNotification, log), returnNewNotification);

         server.get({path: "/applications/:appId/notifications/:notificationId", version: "1.0.0"},
            common.authorize);

         server.del({path: "/applications/:appId/notifications/:notificationId", version: "1.0.0"},
            common.authorize);

      });

};
