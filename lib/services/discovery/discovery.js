/**
 * The shim client for the jetway.io service discovery mechanism.
 *
 * This module is going to look for a file called ".services" in
 * the process directory containing JSON mappings between the
 * various services and the host, port and url for these services.
 * As we expand, a daemon will update these files. This technique
 * is a simple way of ensuring that the discovery service does not
 * become a single point of failure.
 *
 * @module discovery
 */
var _ = require("lodash"),
    fs = require("fs"),
    path = require("path"),
    logger = require("./logger.js");


// Expected file format:
//   {
//      "serviceName": ["url", "url", "url"]
//   }
var knownServices = {},
    log = logger("discovery");


/**
 * Loads the service discovery file from disk into memory. If the
 * file can't be loaded (not on disk, invalid JSON, etc) this function
 * will retain the current state despite being stale.
 *
 * Loading is asynchronous and this function will return immediately.
 */
exports.load = function() {
  var serviceFile = path.join(process.cwd(), ".services");
  log.info("loading services from %s", serviceFile);

  fs.exists(serviceFile, function(exists) {
    if(!exists) {
      log.warn("service file not found. using previously discovered services.");
      return;
    }

    fs.readFile(serviceFile, function(err, data) {
      if(err) {
        log.error("error reading service file (err = %s)", err);
        return;
      }

      try {
        knownServices = JSON.parse(data);
      } catch(ex) {
        // ex is a SyntaxError object
        log.error("failure parsing JSON (%s)", ex);
      }

      log.trace("state of the discovered services = %s", require("util").inspect(knownServices));
    });
  });
};


/**
 * Finds an available service URL that's registered under a service
 * name. If more than one service url is available, the grab function
 * will pick one based on internal routing logic.
 *
 * The callback follows the node.js convention where the first argument
 * is err and set to null if the call was successful. The second
 * argument is the service url or undefined if there was an error.
 *
 * @param serviceName Name of a given external service.
 * @param callback(err,url) User supplied callback function.
 */
exports.find = function(serviceName, callback) {
  var index,
      knownServices = knownServices[serviceName];

  if(knownServices && knownServices.length > 0) {
    index = Math.floor(Math.random() * knownServices.length);
    callback(null, knownServices[index]);
  } else {
    callback("No services found");
  }
};
