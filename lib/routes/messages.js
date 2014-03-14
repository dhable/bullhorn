/**
 * The messages group of ReSTful API endpoints are used to manipulate the
 * messages that we'll be sending out.
 *
 * @module routes/messages
 */

var _ = require("lodash"),
    restify = require("restify"),
    sms = require("../drains/sms.js"),
    email = require("../drains/email.js"),
    logger = require("../logger.js");


/**
 * A restify request handler that validates the parameters
 * to the send notification request to ensure that the request
 * has all the required fields.
 *
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var isSendReqValid = function(req, res, next) {
  if(_.isUndefined(req.params.org)) {
    return next(restify.MissingParameterError("org (organisation generating the notification) is a required parameter."));
  }
  else if(_.isUndefined(req.params.to)) {
    return next(restify.MissingParameterError("to (list of notification recipients) is a required parameter."));
  }
  else if(!_.isArray(req.params.to)) {
    return next(restify.MissingParameterError("to (list of notification recipients) must be an array."));
  }
  else if(_.isUndefined(req.params.msg)) {
    return next(restify.MissingParameterError("msg (the body of the message) is a required parameter."));
  }
  else if(!_.isString(req.params.msg)) {
    return next(restify.MissingParameterError("msg (the body of the message) needs to be a string."));
  }
  else {
    return next();
  }
};


// This is a simple stub function to test out the SMS function
var sendMessage = function(req, res, next) {
  var s = new sms.Drain();
  s.pour(req.params.to, req.params.message)
   .then(function() {res.send("got it");},
         function() {res.send(500, "D'OH!");});

  /*
  var s = new email.Drain();
  s.pour("dhable@gmail.com", req.params.message)
   .then(function() {res.send("got it");},
         function() {res.send(500, "D'OH!");});
  */
};


/**
 * Public method from the route module that defines the URL patterns
 * and binds them to the functional flow for processing the request.
 *
 * @method bind
 */
exports.bind = function(restifyServer) {
  restifyServer.post({version: "1.0.0", path: "/messages"}, isSendReqValid, sendMessage);
};


