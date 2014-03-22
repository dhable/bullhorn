/**
 * Contains all the raw data storage logic.
 */
var _ = require("lodash"),
    when = require("when"),
    levelup = require("levelup"),
    conf = require("./conf.js"),
    logger = require("./logger.js");


var db = levelup(conf().get("db")),
    log = logger("dao");


var KeyNamespace = {
  UserPreferences: "user:",
  OrgMembers: "org:",
  UserOrgs: "userOrg:"
};


// Shutdown hook for LevelDB.
process.on("exit", function(code) {
  var currentTime = process.hrtime()[0],
      waitUntil = currentTime + conf().get("closeGrace");

  db.close();
  while(!db.isClosed() && process.hrtime()[0] < waitUntil) {
    // tight loop waiting for proper db cleanup
  }
});


/**
 *
 */
var get = function(namespace, key, callback) {
  var fullKey = namespace + key;

  db.get(fullKey, function(err, value) {
    if(err)
      return callback(err);

    var parsedValue;
    if(_.isString(value))
      parsedValue = JSON.parse(value);
    else
      parsedValue = value;

    callback(null, parsedValue);
  });
};


/**
 *
 */
var put = function(namespace, key, valueObj, callback) {
  var fullKey = namespace + key,
      valueJSON = JSON.stringify(valueObj);

  db.put(fullKey, valueJSON, callback);
};


/**
 *
 */
var updateIndex = function(namespace, indexKey, valueToAdd) {
  var deferred = when.defer();

  log.info("updateIndex: updating %s%s to include value %s", namespace, indexKey, valueToAdd);
  get(namespace, indexKey, function(err, value) {
    var indexList = value;

    if(err) {
      if(err.notFound)
        indexList = [];
      else {
        deferred.reject(err);
        return;
      }
    }

    if(!_.contains(indexList, valueToAdd)) {
      log.trace("updateIndex: did not find %s in index %s%s - adding", valueToAdd, namespace, indexKey);
      indexList.push(valueToAdd);
      put(namespace, indexKey, indexList, function(err) {
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
exports.associateUserWithOrg = function(userGuid, org) {
  return when.all(
    updateIndex(KeyNamespace.OrgMembers, org, userGuid),
    updateIndex(KeyNamespace.UserOrgs, userGuid, org)
  );
};


/**
 *
 */
exports.saveUserPreferences = function(userGuid, preferences) {
  var deferred = when.defer();

  log.info("updateUserPreferences: saving preferences for %s", userGuid);
  put(KeyNamespace.UserPreferences, userGuid, preferences, function(err) {
    if(err)
      deferred.reject(err);
    else
      deferred.resolve();
  });

  return deferred.promise;
};
