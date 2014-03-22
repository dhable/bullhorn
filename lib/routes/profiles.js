/**
 * A set of ReSTful APIs that allow for CRUD operations on the user
 * notification profile settings.
 *
 * @module routes/profiles
 */

var _ = require("lodash"),
    restify = require("restify"),
    plumber = require("../plumber.js");


/**
 * Verifies a single notification preference rule.
 *
 * @param rule The object literal notification preference rule.
 * @return A restify error object if the rule is invalid, otherwise undefined.
 */
var verifyRoutingRule = function(rule) {
  if(!_.has(rule, "drain"))
    return new restify.MissingParameterError("routing rule instance missing drain property");

  if(!_.has(rule, "id"))
    return new restify.MissingParameterError("routing rule instance missing id property");

  if(!_.has(rule, "exclusive"))
    return new restify.MissingParameterError("routing rule instance missing exclusive property");

  if(rule.drain == "web" && rule.id != "implied")
    return new restify.InvalidArgumentError("id for web drain must be set to 'implied'");
};


/**
 *
 */
var verifyRules = function(req, res, next) {
  var i, err;

  if(!_.isArray(req.params))
    return new restify.InvalidArgumentError("json array expected as top level construct");

  for(i = 0; i < req.params.length; i++) {
    err = verifyRoutingRule(req.params[i]);
    if(err)
      return next(err);
  }

  return next();
};


/**
 *
 */
var saveRule = function(req, res, next) {
  var userGuid = req.context.guid;

  plumber.updateUserPreferences(userGuid, req.params);
  res.end();
};



var noop = function(req, res, next) {
  res.end();
};



/**
 * Public method from the route module that defines the URL patterns
 * and binds them to the functional flow for processing the request.
 *
 * @method bind
 */
exports.bind = function(restifyServer) {
  restifyServer.post({version: "0.1.0", path: "/profiles/:guid"}, verifyRules, saveRule);
  restifyServer.get({version: "0.1.0", path: "/profiles/:guid"}, noop);
  restifyServer.put({version: "0.1.0", path: "/profiles/:guid"}, verifyRules, saveRule);
  restifyServer.del({version: "0.1.0", path: "/profiles/:guid"}, noop);
};
