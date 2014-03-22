/**
 * The plumber is the master of all the drains in the system (funny,
 * right). This module contains all the logic for selecting the right
 * drain to use for communication at that moment in time.
 *
 * @module plumber
 */
var _ = require("lodash"),
    when = require("when"),
    levelup = require("levelup"),
    conf = require("./conf"),
    logger = require("./logger.js");


var db = levelup(conf().get("db")),
    log = logger("plumber");


// Shutdown hook for LevelDB
process.on("exit", function() {
  db.close();
  while(!db.isClosed()) {
    // tight loop waiting for proper db cleanup
  }
});


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



var addUserToOrgList = function(userGuid, org) {
  var deferred = when.defer();

  log.info("addUserToOrgList: saving user %s into orgs %s", userGuid, org);
  db.get(org, function(err, value) {
    var userList = value;

    log.trace("addUserToOrgList: finished fetching existing org list");
    if(err) {
      if(err.notFound) {
        userList = [];
      } else {
        deferred.reject(err);
        return;
      }
    }

    if(!_.contains(userList)) {
      log.trace("addUserToOrgList: adding user %s to org list %s", userGuid, org);
      userList.push(userGuid);
      db.put(org, userList, function(err) {
        if(err)
          deferred.reject(err);
        else
          deferred.resolve();
      });
    }
  });

  return deferred.promise;
};


/**
 *
 */
var updateUserPreferences = function(userGuid, preferences) {
  var deferred = when.defer();

  log.info("updateUserPreferences: saving preferences for %s", userGuid);
  db.put(userGuid, preferences, function(err) {
    if(err)
      deferred.reject(err);
    else
      deferred.resolve();
  });

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

  promises.push(updateUserPreferences(userGuid, preferences));

  for(i = 0; i < memberOf.length; i++) {
    promises.push(addUserToOrgList(userGuid, memberOf[i]));
  }

  return when.all(promises);
};
