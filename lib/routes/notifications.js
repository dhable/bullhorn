/**
 * The notifications group of ReSTful API endpoints are used to manipulate the
 * messages that we'll be sending out.
 *
 * @module routes/notifications
 */

var _ = require("lodash"),
    restify = require("restify"),
    sms = require("../drains/sms.js"),
    email = require("../drains/email.js"),
    logger = require("../logger.js");


/**
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var ensureRequiredFields = function(req, res, next) {
  if(_.isUndefined(req.params.org))
    return next(restify.MissingParameterError("org is a required parameter."));

  if(_.isUndefined(req.params.to))
    return next(restify.MissingParameterError("to is a required parameter."));

  if(_.isUndefined(req.params.msg))
    return next(restify.MissingParameterError("msg is a required parameter."));

  return next();
};


/**
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var ensureFieldTypes = function(req, res, next) {
  if(!_.isString(req.params.org))
    return next(restify.InvalidArgumentError("org needs to be a string."));

  if(!_.isArray(req.params.to))
    return next(restify.InvalidArgumentError("to must be an array."));

  if(!_.isString(req.params.msg))
    return next(restify.InvalidArgumentError("msg needs to be a string."));

  if(_.has(req.params, "template") && !_.isString(req.params.template))
    return next(restify.InvalidArgumentError("template needs to be a string."));

  return next();
};


var resolveOrgAndToIds = function(req, res, next) {
  // TODO: This needs to load the data up
};


var dispatchNotification = function(req, res, next) {
  // TODO: Make this use the plumber

  sms.pour(req.params.to, req.params.message)
     .then(function() {res.send("got it");},
           function() {res.send(500, "D'OH!");});

  /*
  email.pour("dhable@gmail.com", req.params.message)
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
  restifyServer.post({version: "0.1.0", path: "/notifications"}, ensureRequiredFields, ensureFieldTypes,
                                                                 resolveOrgAndToIds, dispatchNotification);
};


