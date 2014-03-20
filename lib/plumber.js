/**
 * The plumber is the master of all the drains in the system (funny,
 * right). This module contains all the logic for selecting the right
 * drain to use for communication at that moment in time.
 *
 * @module plumber
 */
var when = require("when"),
    levelup = require("levelup"),
    conf = require("./conf");


var db = levelup(conf().get("db"));


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


exports.updateUserPreferences = function(userGuid, ruleSet) {
  console.log("saving %s for %s", ruleSet, userGuid);
};
