/**
 * A set of ReSTful APIs that allow for CRUD operations on the user
 * notification profile settings.
 *
 * @module routes/profiles
 */

var _ = require("lodash"),
    restify = require("restify"),
    dao = require("../dao.js");


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
 * Validate that the body of the user preference call has all the required fields
 * and that the structure is correct.
 *
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var validatePrefParams = function(req, res, next) {
  var i, err;

  if(_.isUndefined(req.params.prefs))
    return next(new restify.MissingParameterError("params is a required parameter"));


  if(!_.isArray(req.params.prefs))
    return new restify.InvalidArgumentError("json array expected as top level construct");

  for(i = 0; i < req.params.prefs.length; i++) {
    err = validatePrefRule(req.params.prefs[i]);
    if(err)
      return next(err);
  }

  return next();
};


/**
 * Validate that the body of the user association call has all the required fields
 * and that the structure is correct.
 *
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var validateAssocParams = function(req, res, next) {
  if(_.isUndefined(req.params.memberOf))
    return next(new restify.MissingParameterError("memberOf is a required parameter"));

  if(!_.isArray(req.params.memberOf))
    return next(new restify.InvalidArgumentError("memberOf must be an array."));

  return next();
};


/**
 * Restify handler to fetch the user preferences and respond to restify
 * in the necessary format.
 *
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var fetchUserPreferences = function(req, res, next) {
  var userGuid = req.context.guid;

  dao.getUserPreferences(userGuid, function(err, preferences) {
    if(err) {
      res.send(500, err);
    } else {
      res.json(preferences);
    }

    return next();
  });
};


/**
 * Restify handler to save the user preferences into the database.
 *
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var savePreferences = function(req, res, next) {
  var userGuid = req.context.guid,
      preferences = req.params.prefs;

  dao.saveUserPreferences(userGuid, preferences, function(err) {
    if(err) {
      res.send(500, err);
    } else {
      res.send(200);
    }

    return next();
  });
};


/**
 * Restify handler that deletes a user and their associations from the database.
 * Since the associations are children of the user entity, it stands to reason
 * that they would be wiped out when the user object is deleted.
 *
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var deleteUser = function(req, res, next) {
  var userGuid = req.context.guid;

  dao.deleteUserPreferences(userGuid, function(err) {
    if(err) {
      res.send(500, err);
    } else {
      res.send(200);
    }

    return next();
  });
};


/**
 * Restify handler to fetch the user associations and response to
 * restify in the necessary format.
 *
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var fetchUserAssociations = function(req, res, next) {
  var userGuid = req.context.guid;

  dao.fetchAssociatedOrgs(userGuid, function(err, associatedOrgs) {
    if(err) {
      res.send(500, err);
    } else {
      res.send(associatedOrgs);
    }

    return next();
  });
};


/**
 * Restify handler to save the user associations and response to
 * restify in the necessary format.
 *
 * @param req The restify Request object instance.
 * @param res The restify Response object instance.
 * @param next Callback to let restify know how the remaining
 *             chained handlers should be invoked.
 */
var saveUserAssociations = function(req, res, next) {
  var userGuid = req.context.guid,
      memberOf = req.params.memberOf;

  dao.associateUserWithOrgs(userGuid, memberOf, function(err) {
    if(err) {
      res.send(500, err);
    } else {
      res.send(200);
    }

    return next();
  });
};


/**
 * Public method from the route module that defines the URL patterns
 * and binds them to the functional flow for processing the request.
 *
 * @method bind
 */
exports.bind = function(restifyServer) {
  restifyServer.get({version: "0.1.0", path: "/profiles/:guid"}, fetchUserPreferences);
  restifyServer.put({version: "0.1.0", path: "/profiles/:guid"}, validatePrefParams, savePreferences);
  restifyServer.del({version: "0.1.0", path: "/profiles/:guid"}, deleteUser);

  restifyServer.get({version: "0.1.0", path: "/profiles/:guid/associations"}, fetchUserAssociations);
  restifyServer.put({version: "0.1.0", path: "/profiles/:guid/associations"}, validateAssocParams, saveUserAssociations);
};
