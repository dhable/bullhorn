/**
 * Simple wrapper module around the statsd module specific to our
 * application. The wrapper handles building the client with the
 * correct options.
 *
 * @module statds
 */
var statsd = require("node-statsd"),
    conf = require("./conf.js");

// Separation character used to break apart the stat name into logical
// groupings.
var NAME_SEPARATOR = ".";


// Internal statsd client built from the configuration module
var client = new statsd.StatsD({
  host: conf.get("statsd.host"),
  port: conf.get("statsd.port"),
  prefix: conf.get("statsd.namespace") + NAME_SEPARATOR,
  suffix: "",
  globalize: false,
  mock: conf.get("statsd.disable")
});


/**
 * Raw implementation of the client. This should not be used in the
 * rest of the application typically. For things, like drain stats,
 * consider adding wrapped functions with sane defaults for predefined
 * modules.
 */
exports.client = client;


/**
 * Emits stats about the state of a drain processing.
 *
 * @param drainName The name of the drain emitting the stat.
 * @param numSuccess The number of recipients that were reported as passing by the drain's implementation.
 * @param numFailure The number of recipients that were reported as failed by the drain's implementation.
 * @param processingTime The total number of milliseconds required to execute the notification operation.
 */
exports.recordNotificationProcessed = function(drainName, numSuccess, numFailure, processingTime) {
  client.increment(drainName + NAME_SEPARATOR + "processed");
  client.increment(drainName + NAME_SEPARATOR + "success", numSuccess);
  client.increment(drainName + NAME_SEPARATOR + "failure", numFailure);
  client.gauge(drainName + NAME_SEPARATOR + "execution-time", processingTime);
};
