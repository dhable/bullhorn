/**
 * Implementation of the v1 ReST API for the bullhorn service. Once
 * deployed, the code in this file should remain constant.
 *
 * @module routes/v1
 */

var sms = require("../drains/sms.js"),
    logger = require("../logger.js");


var noopFunction = function(req, res, next) {
  res.send("noop");
  return next();
};


// This is a simple stub function to test out the SMS function
var sendMessage = function(req, res, next) {
  var s = new sms.Drain();
  s.pour(req.params.to, req.params.message)
   .then(function() {res.send("got it");},
         function() {res.send(500, "D'OH!");});
};


/**
 * Public method from the route module that defines the URL patterns
 * and binds them to the functional flow for processing the request.
 *
 * @method bind
 */
exports.bind = function(restifyServer) {

  // Path for posting a new outbound message for a given user
  restifyServer.post({version: "1.0.0", path: "/users/:userId/messages"}, sendMessage);

  // Path for fetching health stats about the server
  restifyServer.get({version: "1.0.0", path: "/health?detailed=:detailed"}, noopFunction);

  // Path for fetching the notification send statistics
  restifyServer.get({version: "1.0.0", path: "/stats"}, noopFunction);
};
