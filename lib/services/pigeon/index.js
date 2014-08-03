/**
 * Service that picks up outbound notification messages from the queue
 * and processes them using outbound drains.
 */
var _ = require("lodash"),
    rsvp = require("rsvp"),
    amqplib = require("amqplib"),
    dao = require("../../dao");

/**
 * Logging handler bound to the pigeon logging namespace.
 * @private
 */
var log = require("../../logger.js")("pigeon");


/**
 * Represents a connection to a RabbitMQ broker. This should be used to
 * build channels for performing all the work.
 * @private
 */
var queueConnection;


/**
 * Assembles more concrete ojects for the drain threads and then puts
 * them into the appropriate queue based on the type.
 */
var pourIntoDrain = function(channel, drainPref, msg) {
   var queueName = "notification." + drainPref.type,
       payload;

   payload = JSON.stringify({
      to: drainPref.addr,
      subject: msg.subject,
      body: msg.body
   });

   channel.assertQueue(queueName);
   channel.sendToQueue(queueName, new Buffer(payload));
};


/**
 * Reads a generic outbound message for processing and uses the Recipient
 * object to determine the best ways to route the message.
 */
var dispatchMessage = function(channel, msg) {
   if(msg !== null) {
      var hydratedMsg, rawContent, recipientPromises;

      try {
         rawContent = msg.content.toString();
         log.debug("notification message -> %s", rawContent);

         hydratedMsg = JSON.parse(rawContent);
         dao.Profile
            .findById(hydratedMsg.to)
            .then(function(profileObj) {

               profileObj.drains.forEach(function(drainPref) {
                  if(_.contains(drainPref.for, hydratedMsg.domain)) {
                     pourIntoDrain(channel, drainPref, hydratedMsg);
                  }
               });

               channel.ack(msg);
            })
            .catch(function(err) {
               log.warn("incoming notification message contained error - %s", err.message);
               channel.nack(msg);
            });
      }
      catch(err) {
         log.warn("notification message could not be parsed into JSON - %s", err.message);
         channel.nack(msg);
      }
   }
};


/**
 * Helper function that starts a particular inbound queue listener.
 */
var listenOnQueue = function() {
   return queueConnection.createChannel()
                .then(function(channel) {
                   channel.assertQueue("notification");
                   channel.consume("notification",
                                   _.curry(dispatchMessage)(channel));
                });
};


/**
 * The name of this service
 */
var serviceName = exports.name = "Pigeon (message dispatcher)";


/**
 * The defined function that starts up this service. For Pigeon,
 * it starts the message queue listeners.
 */
exports.start = function(conf) {
   var queueUrl = conf.get("pigeon.queue.broker");
   log.info("connecting to message queue broker at %s", queueUrl);

   amqplib.connect(queueUrl)
          .then(function(conn) {
             queueConnection = conn;
             return listenOnQueue();
          });
};


/**
 * This function stops the Pigeon service. It does so by simply
 * closing the queue connection. This will in turn shut down all of
 * the channels.
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
