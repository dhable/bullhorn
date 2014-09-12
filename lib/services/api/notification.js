/**
 * Contains all of the notification API definitions.
 *
 * @module services.api.routes.notifications
 */
var _ = require("lodash"),
    uuid = require("node-uuid"),
    restify = require("restify"),
    amqplib = require("amqplib"),
    dao = require("../../dao");


var loadDomainFromAccessKey = function(log, common, req, res, next) {
   var accessKeyId = req.local.accessKeyId;

   dao.AccessKey.findById(accessKeyId)
      .then(function(accessKeyObj) {
         req.context.domainId = accessKeyObj.domain;
         common.loadDomain(req, res, next);
      })
      .catch(function(err) {
         if(err.notFound) {
            return next(new restify.NotFoundError());
         } else {
            log.error("unhandled err looking up domain by access key. reason: %s", err);
            return next(new restify.InternalServerError());
         }
      });
};



/**
 * Restify handler that enqueues the notification message for processing
 * later on. This method needs to be partial invoked so the log parameter
 * can be bound to the application log instance.
 */
var queueNotification = function(channel, log, req, res, next) {
   log.info("inside queueNotification");

   var payload = {
      id: uuid.v1(), 
      recipient: req.body.recipient,
      template: req.body.template,
      params: req.body.params
   };

   dao.Profile.findById(payload.recipient.profile)
      .then(function(profile) {
         if(req.local.domain.id !== profile.domain) {
            // best way to handle this?
            // next(new restify.BadRequest());
            console.log("oops");
         }
         else {
            payload.recipient.profile = profile; // replace the profile id with object details
            return channel.sendToQueue("notification", new Buffer(JSON.stringify(payload)));
         }
      })
      .then(function() {
         req.local.messageGuid = payload.id;
         next();
      })
      .catch(function(err) {
         log.error("failed to queue notification message - %s", err.message);
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
         return connection.createChannel();
      })
      .then(function(channel) {
         return channel.assertExchange("notification-dlx", "direct")
                       .then(channel.assertQueue("notification", {deadLetterExchange: "notification-dlx"}))
                       .then(function() { return channel; });
      })
      .then(function(channel) {
         server.post({path: "/notifications", version: "1.0.0"},
            common.authorize, _.partial(loadDomainFromAccessKey, log, common), _.partial(queueNotification, channel, log), returnNewNotification);

         server.get({path: "/notifications/:notificationId", version: "1.0.0"},
            common.authorize);
      });

};
