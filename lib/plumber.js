/**
 * The plumber is the master of all the drains in the system (funny,
 * right). This module contains all the logic for selecting the right
 * drain to use for communication at that moment in time.
 *
 * @module plumber
 */
var _ = require("lodash"),
    when = require("when"),
    dao = require("./dao.js"),
    logger = require("./logger.js");


var log = logger("plumber");


exports.RecipientTypes = {
  "user": function(idValue) { return true; },
  "org": function(idValue) { return true; },
  "sms": function(idValue) { return true; },
  "email": function(idValue) { return true; }
};


exports.dispatch = function(options) {
  var deferred = when.defer();

  setTimeout(function() {
    deferred.resolve();
  }, 3000);

  return deferred.promise;
};


/**
 *
 */
exports.updateUserPreferences = function(userGuid, options) {
  var i,
      promises = [],
      memberOf = options.memberOf,
      preferences = options.prefs;

  promises.push(dao.saveUserPreferences(userGuid, preferences));

  // TODO: association need to occur in series
  for(i = 0; i < memberOf.length; i++) {
    promises.push(dao.associateUserWithOrg(userGuid, memberOf[i]));
  }

  return when.all(promises);
};
