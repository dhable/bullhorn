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


/**
 *
 */
exports.name = "Pigeon (message sender)";


/**
 *
 */
exports.start = function(conf) {
   var queueUrl = conf.get("pigeon.queue.broker");
   log.info("connecting to message queue broker at %s", queueUrl);

   broker = amqplib.connect(queueUrl);
   broker.then(function(conn) {
         return conn.createChannel()
                    .then(function(channel) {
                       channel.assertQueue("notification");
                       channel.consume("notification",
                                       _.curry(dispatchMessage)(channel));
                    });
   });

};


/**
 *
 */
exports.stop = function() {
};
