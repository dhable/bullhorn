/**
 *
 */
var _ = require("lodash"),
    amqplib = require("amqplib");

/**
 * Logging handler bound to the pigeon logging namespace.
 * @private
 */
var log = require("../../logger.js")("pigeon");


var broker;


/**
 *
 */
var dispatchMessage = function(channel, msg) {
   log.debug("handling inbound message");
   if(msg !== null) {
      console.log("got message -> " + msg.content.toString());
      channel.ack(msg);
   }
};


var listenOnQueue = function() {
   return broker.createChannel()
                .then(function(channel) {
                   channel.assertQueue("notification");
                   channel.consume("notification",
                                   _.curry(dispatchMessage)(channel));
                });
};


/**
 *
 */
var serviceName = exports.name = "Pigeon (message sender)";


/**
 *
 */
exports.start = function(conf) {
   var queueUrl = conf.get("pigeon.queue.broker");
   log.info("connecting to message queue broker at %s", queueUrl);

   amqplib.connect(queueUrl)
          .then(function(conn) {
            broker = conn;
            return listenOnQueue();
   });
};


/**
 *
 */
exports.stop = function() {
   log.info("shutting down %s", serviceName);

   if(!broker) {
      return;
   }

   broker.close(function(err) {
      log.error("errors encountered closing message queue connection - %j", err);
   });

   broker = undefined;
};
