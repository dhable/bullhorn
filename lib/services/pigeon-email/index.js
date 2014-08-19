/**
 * The Email drain takes an notification request and transforms it into a
 * SendGrid Email API request so the notification can be sent via email.
 *
 * @module email
 */
var _ = require("lodash"),
    amqplib = require("amqplib"),
    sendgrid = require("sendgrid"),
    statsd = require("../../statsd");


/**
 * Logging handler bound to the pigeon-email logging namespace.
 * @private
 */
var log = require("../../logger.js")("drain.email");


/**
 * Represents a connection to a RabbitMQ broker. This should be used to
 * build channels for performing all the work.
 * @private
 */
var queueConnection;


var sendEmail = function(conf, channel, msg) {
   if(msg !== null) {
      var startTime, rawContent, hydratedMsg, sendGridClient, email;

      try {
         startTime = Date.now();
         rawContent = msg.content.toString();
         log.debug("Email message -> %s", rawContent);

         hydratedMsg = JSON.parse(rawContent);

         sendGridClient = sendgrid(conf.get("sendgrid.user"), conf.get("sendgrid.key"));

         email = new sendGridClient.Email({
            to: hydratedMsg.to,
            from: conf.get("email.from"),
            subject: hydratedMsg.subject,
            text: hydratedMsg.body
         });

         sendGridClient.send(email, function(err, resp) {
            var duration = Date.now() - startTime;
            statsd.recordNotificationProcessed("email", (err ? 0 : 1), (err ? 1 : 0), duration);

            if(err) {
               log.warn("failed to send Email via SendGrid - %s", err);
               channel.nack(msg);
            } else {
               channel.ack(msg);
            }
         });
      }
      catch(err) {
         log.warn("notification Email message could not be parsed into JSON - %s", err.message);
         channel.nack(msg);
      }
   }
};


/**
 * Helper function that listens for inbound pigeon-email drain messages
 * and takes the necessary action.
 * @private
 */
var listenOnQueue = function(conf) {
   return queueConnection.createChannel()
               .then(function(channel) {
                  channel.assertQueue("notification.email");
                  channel.consume("notification.email",
                                  _.partial(sendEmail, conf, channel));
               });
};


/**
 * The name of this service
 */
var serviceName = exports.name = "Pigeon Email Drain";


/**
 * Starts the pigeon-email drain service. This service blocks until
 * messages arrive on the queue for processing.
 */
exports.start = function(conf) {
   var queueUrl = conf.get("pigeon.queue.broker");
   log.info("connecting to message queue broker at %s", queueUrl);

   amqplib.connect(queueUrl)
          .then(function(conn) {
             queueConnection = conn;
             return listenOnQueue(conf);
          });
};


/**
 * Stops the pigeon-email drain service. We close the queue broker
 * connection and this will in turn shut down all the channels.
 */
exports.stop = function() {
   log.info("shutting down %s", serviceName);

   if(!queueConnection) {
      return;
   }

   queueConnection.close(function(err) {
      log.error("errors encountered closing message queue connection - %j", err);
   });

   queueConnection = undefined;
};
