/**
 * The SMS drain takes an inbound notification request and transforms it into a
 * Twilio API call so it can be sent via SMS.
 *
 * @module sms
 */
var _ = require("lodash"),
    twilio = require("twilio"),
    amqplib = require("amqplib"),
    statsd = require("../../statsd.js");


/**
 * Logging handler bound to the pigeon-sms logging namespace.
 * @private
 */
var log = require("../../logger.js")("pigeon-sms");


/**
 * Represents a connection to a RabbitMQ broker. This should be used to
 * build channels for performing all the work.
 * @private
 */
var queueConnection;


var sendSMS = function(conf, channel, msg) {
   if(msg !== null) {
      var startTime, rawContent, hydratedMsg, twilioClient,
          twilioAccountSID, twilioAuthToken, smsFromNumber;

      try {
         startTime = Date.now();
         rawContent = msg.content.toString();
         log.debug("SMS message -> %s", rawContent);

         hydratedMsg = JSON.parse(rawContent);

         twilioClient = twilio(conf.get("twilio.accountSid"), conf.get("twilio.authToken"));
         twilioClient.sendMessage({
            to: hydratedMsg.to,
            from: conf.get("sms.shortCode"),
            body: hydratedMsg.body
         }, function(err, resp) {
            var duration = Date.now() - startTime;
            statsd.recordNotificationProcessed("sms", (err ? 0 : 1), (err ? 1 : 0), duration);

            if(err) {
               log.warn("failed to send SMS via twilio - %s", err);
               channel.nack(msg);
            } else {
               channel.ack(msg);
            }
         });
      }
      catch(err) {
         log.warn("notification SMS message could not be parsed into JSON - %s", err.message);
         channel.nack(msg);
      }
   }
};


/**
 * Helper function that listens for inbound pigeon-sms drain messages
 * and take the necessary action.
 */
var listenOnQueue = function(conf) {
   return queueConnection.createChannel()
               .then(function(channel) {
                  channel.assertQueue("notification.sms");
                  channel.consume("notification.sms",
                                  _.partial(sendSMS, conf, channel));
               });
};


/**
 * The name of this service
 */
var serviceName = exports.name = "Pigeon SMS Drain";


/**
 * Starts the pigeon-SMS drain service. The service blocks until
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
 * Stops the pigeon-sms drain service. We close the queue broker
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
