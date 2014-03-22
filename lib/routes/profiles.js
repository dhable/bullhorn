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
 * Validates a single notification preference rule.
 *
 * @param rule The object literal notification preference rule.
 * @return A restify error object if the param and it's content are invalid, otherwise
 *         it will return undefined.
 */
var validatePrefRule = function(rule) {
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
 * Validate that the prefs parameter follows the correct format rules and is valid.
 *
 * @param prefs An array of notification preference rules.
 * @return A restify error object if the param and it's content are invalid, otherwise
 *         it will return undefined.
 */
var validatePrefs = function(prefs) {
  var i, err;

  if(!_.isArray(prefs))
    return new restify.InvalidArgumentError("json array expected as top level construct");

  for(i = 0; i < prefs.length; i++) {
    err = validatePrefRule(prefs[i]);
    if(err)
      return err;
  }
};


/**
 * Validate that the memberOf parameter follows the correct format.
 *
 * @param memberOf An array of orginizations the user a member of.
 * @return A restify error object if the param and it's content are invalid, otherwise
 *         it will return undefined.
 */
var validateMemberOf = function(memberOf) {
  if(!_.isArray(memberOf))
    return new restify.InvalidArgumentError("memberOf must be an array.");

};


/**
 * Validate all the body parameter elements used in the POST and PUT methods
 * used to create and update the preferences.
 *
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var validateBodyParams = function(req, res, next) {
  var err;

  // Ensure the params are present on the request
  if(_.isUndefined(req.params.memberOf))
    return next(new restify.MissingParameterError("member is a required parameter"));

  if(_.isUndefined(req.params.prefs))
    return next(new restify.MissingParameterError("params is a required parameter"));


  // Check each parameter is valid, including sub structures.
  err = validateMemberOf(req.params.memberOf) || validatePrefs(req.params.prefs);
  if(err)
    return next(err);


  // Everything must be cool so continue on to the next handler
  return next();
};




/**
 *
 */
var savePreferences = function(req, res, next) {
  var userGuid = req.context.guid;

  plumber.updateUserPreferences(userGuid, req.params);
  res.end();
};








/*

  {
    "memberOf": [...orgs...],
    "prefs": [
      ...preference rules...
    ]
  }

 */

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
  restifyServer.get({version: "0.1.0", path: "/profiles/:guid"}, noop);
  restifyServer.put({version: "0.1.0", path: "/profiles/:guid"}, validateBodyParams, savePreferences);
  restifyServer.del({version: "0.1.0", path: "/profiles/:guid"}, noop);
};
