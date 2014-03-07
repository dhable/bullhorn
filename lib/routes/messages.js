/**
 * The messages group of ReSTful API endpoints are used to manipulate the
 * messages that we'll be sending out.
 *
 * @module routes/messages
 */

var sms = require("../drains/sms.js"),
    logger = require("../logger.js");



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
  restifyServer.post({version: "1.0.0", path: "/users/:userId/messages"}, sendMessage);
};


