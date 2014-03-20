/**
 * The notifications group of ReSTful API endpoints are used to manipulate the
 * messages that we'll be sending out.
 *
 * @module routes/notifications
 */

var _ = require("lodash"),
    restify = require("restify"),
    logger = require("../logger.js"),
    plumber = require("../plumber.js");


/**
 * Restify handler that checks all the required fields at the top
 * level exist.
 *
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var ensureRequiredFields = function(req, res, next) {
  if(_.isUndefined(req.params.to))
    return next(new restify.MissingParameterError("to is a required parameter."));

  if(_.isUndefined(req.params.msg))
    return next(new restify.MissingParameterError("msg is a required parameter."));

  return next();
};


/**
 * Restify handler that checks the types of all the top level fields
 * and ensures they are correct.
 *
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var ensureFieldTypes = function(req, res, next) {
  if(!_.isArray(req.params.to))
    return next(new restify.InvalidArgumentError("to must be an array."));

  if(!_.isString(req.params.msg))
    return next(new restify.InvalidArgumentError("msg needs to be a string."));

  if(_.has(req.params, "template") && !_.isString(req.params.template))
    return next(new restify.InvalidArgumentError("template needs to be a string."));

  return next();
};


/**
 * Restify handler that checks all of the recipient objects and
 * ensures the format is correct in terms of required fields, types
 * and formats.
 *
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var checkRecipientFields = function(req, res, next) {
  var typeValidator, recipient, i;

  if(_.isEmpty(req.params.to))
    return next(new restify.MissingParameterError("to array cannot be empty"));

  for(i = 0; i < req.params.to.length; i++) {
    recipient = req.params.to[i];

    if(!_.has(recipient, "type"))
      return next(new restify.MissingParameterError("all recipients need a type"));

    if(!_.has(recipient, "id"))
      return next(new restify.MissingParameterError("all recipients need an id"));

    if(!_.has(plumber.RecipientTypes, recipient.type))
      return next(new restify.InvalidArgumentError(recipient.type + " is not a valid type."));

    if(!plumber.RecipientTypes[recipient.type](recipient.id))
      return next(new restify.InvalidArgumentError(recipient.id + " is not valid."));
  }

  return next();
};


/**
 * Restify handler to dispatch the notification to the plumber
 * and then wait for it to complete successfully.
 *
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var dispatchNotification = function(req, res, next) {
  plumber.dispatch(req.params)
         .then(function() { res.end(); },
               function() { res.send(500); });
};


/**
 * Public method from the route module that defines the URL patterns
 * and binds them to the functional flow for processing the request.
 *
 * @method bind
 */
exports.bind = function(restifyServer) {
  restifyServer.post({version: "0.1.0", path: "/notifications"}, ensureRequiredFields, ensureFieldTypes,
                                                                 checkRecipientFields, dispatchNotification);
};


