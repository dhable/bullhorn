/**
 * Contains all the raw data storage logic.
 */
var _ = require("lodash"),
    when = require("when"),
    nodefn = require("when/node/function"),
    levelup = require("levelup"),
    conf = require("./conf.js"),
    logger = require("./logger.js");


var db = levelup(conf().get("db")),
    log = logger("dao");


// This is a shutdown hook in the node process that makes an
// attempt to clean up the leveldb locks and buffers.
process.on("exit", function(code) {
  var currentTime = process.hrtime()[0],
      waitUntil = currentTime + conf().get("closeGrace");

  db.close();
  while(!db.isClosed() && process.hrtime()[0] < waitUntil) {
    // tight loop waiting for proper db cleanup
  }
});


/**
 * Enumeration of various namesapces that data is stored. Since
 * level DB is just a key/value store, we prepend the keys with
 * these strings to segerate them and allow the storage of smaller
 * bits of data in the database.
 */
var KeyNamespace = {
  UserPreferences: "user:",
  OrgMembers: "org:",
  UserOrgs: "user:org:"
};


/**
 * A JSON deserialized and namespace aware version of the leveldb
 * get function. In cases where JSON can't be parsed from the
 * value in leveldb, the raw value will be returned.
 *
 * @param namespace The KeyNamespace value to retrieve from.
 * @param key The key value to retrieve
 * @param callback The levelup get callback handler (err, value).
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
 * A JSON serialized and namespace aware version of the leveldb
 * put function.
 *
 * @param namespace The KeyNamespace value to store to.
 * @param key The key value to store.
 * @param valueObj The object to serialize to JSON for storage.
 * @param callback The levelup get callback handler (err, value).
 */
var put = function(namespace, key, valueObj, callback) {
  var fullKey = namespace + key,
      valueJSON = JSON.stringify(valueObj);

  db.put(fullKey, valueJSON, {sync: true}, callback);
};


/**
 * A namespace aware version of the leveldb del function.
 *
 * @param namespace The KeyNamespace value to delete from.
 * @param key The key value to delete.
 * @param callback The levelup get callback handler (err).
 */
var del = function(namespace, key, callback) {
  var fullKey = namespace + key;
  console.log("deleting %s", fullKey);
  db.del(fullKey, {sync: true}, callback);
};


/**
 * In our leveldb implementation, an index is some key/value pair where
 * the value is an array of keys. For instance, if there is a user "123",
 * the index for org "A" that includes this user would be:
 *
 *   key: org:A
 *   value: ["123", ...]
 *
 * This function can add a value to any index structure in leveldb. If the
 * index key doesn't exist, it will be created. If the value is already in
 * the index, the index will remained unchanged but the operation should
 * succeed.
 *
 * @param namespace The KeyNamespace the index belongs to.
 * @param indexKey The name of the index within the namespace.
 * @param valueToAdd The entity key to add to the index.
 * @return A promise representing the status of the operation.
 */
var addToIndex = function(namespace, indexKey, valueToAdd) {
  var deferred = when.defer();

  log.info("addToIndex: updating %s%s to include value %s", namespace, indexKey, valueToAdd);
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
      log.trace("addToIndex: did not find %s in index %s%s - adding", valueToAdd, namespace, indexKey);
      indexList.push(valueToAdd);
      put(namespace, indexKey, indexList, function(err) {
        if(err)
          deferred.reject(err);
        else
          deferred.resolve();
      });
    } else {
      deferred.resolve();
    }
  });

  return deferred.promise;
};


/**
 * In our leveldb implementation, an index is some key/value pair where
 * the value is an array of keys. For instance, if there is a user "123",
 * the index for org "A" that includes this user would be:
 *
 *   key: org:A
 *   value: ["123", ...]
 *
 * This function can remove a value from any index structure in leveldb. If
 * the index doesn't exist, this operation will succeed. If the value is not
 * part of the index, the index will remained unchanged but the operation
 * should succeed.
 *
 * @param namespace The KeyNamespace the index belongs to.
 * @param indexKey The name of the index within the namespace.
 * @param valueToAdd The entity key to remove from the index.
 * @return A promise representing the status of the operation.
 */
var deleteFromIndex = function(namespace, indexKey, valueToDelete) {
  var deferred = when.defer();

  log.info("deleteFromIndex: updating %s%s to remove value %s", namespace, indexKey, valueToDelete);
  get(namespace, indexKey, function(err, indexList) {
    if(err) {
      if(err.notFound) {
        deferred.resolve();
      } else {
        deferred.reject(err);
      }

      return;
    }

    if(_.contains(indexList, valueToDelete)) {
      put(namespace, indexKey, _.without(indexList, valueToDelete), function(err) {
        if(err)
          deferred.reject(err);
        else
          deferred.resolve();
      });
    } else {
      deferred.resolve();
    }
  });

  return deferred;
};


/**
 * Builds an association between a user and an org. With this association
 * the user will now be included on notifications that are sent to an org.
 *
 * @param userGuid The id of the user entity.
 * @param org The id of the org entity.
 * @return A promise representing the status of the operation.
 */
exports.associateUserWithOrg = function(userGuid, org) {
  log.info("associateUserWithOrg: assocating user %s with %s org", userGuid, org);
  return when.all([
    addToIndex(KeyNamespace.OrgMembers, org, userGuid),
    addToIndex(KeyNamespace.UserOrgs, userGuid, org)
  ]);
};


/**
 * Breaks an association between a user and an org.
 *
 * @param userGuid The id of the user entity.
 * @param org The id of the org entity.
 * @return A promise representing the status of the operation.
 */
exports.disassociateUserWithOrg = function(userGuid, org) {
  log.info("disassociateUserWithOrg: disassocating user %s with %s org", userGuid, org);
  return when.all([
    deleteFromIndex(KeyNamespace.OrgMembers, org, userGuid),
    deleteFromIndex(KeyNamespace.UserOrgs, userGuid, org)
  ]);
};


/**
 * Performs a lookup of all the orgs that a given user is associated with.
 * When the promise is resolved, the first argument will be an array of
 * org ids.
 *
 * @param userGuid The id of the user entity.
 * @return A promise representing the status of the operation.
 */
exports.fetchAssociatedOrgs = function(userGuid) {
  log.info("fetchAssociatedOrgs: fetching org associations for user %s", userGuid);
  return nodefn.call(get, KeyNamespace.UserOrgs, userGuid);
};


/**
 * Performs a lookup of all the users that a given org is associated with.
 * When the promise is resolved, the first argument will be an array of
 * userGuids.
 *
 * @param org The id of the org entity.
 * @return A promise representing the status of the operation.
 */
exports.fetchAssociatedUsers = function(org) {
  log.info("fetchAssociatedUsers: fetching user associations for org %s", org);
  return nodefn.call(get, KeyNamespace.OrgMembers, org);
};


/**
 * Save a new or updated user preference objct array in the database.
 *
 * @param userGuid The id of the user entity.
 * @param preferences The array of notification preference objects.
 * @return A promise representing the status of the operation.
 */
exports.saveUserPreferences = function(userGuid, preferences) {
  log.info("updateUserPreferences: saving preferences for %s", userGuid);
  return nodefn.call(put, KeyNamespace.UserPreferences, userGuid, preferences);
};


/**
 * Performs a lookup of the user notification preferences in the database.
 * The result will be available as the first argument to the promise when
 * resolved.
 *
 * @param userGuid The id of the user entity.
 * @return A promise representing the status of the operation.
 */
exports.getUserPreferences = function(userGuid) {
  log.info("getUserPreferences: fetch user preferences for %s", userGuid);
  return nodefn.call(get, KeyNamespace.UserPreferences, userGuid);
};


/**
 * Removes a user notification preference block in the database. Since
 * our data store is not relational, this method will not remove the
 * user associations to orgs in the database.
 *
 * @param userGuid The id of the user entity.
 * @return A promise representing the status of the operation.
 */
exports.deleteUserPreferences = function(userGuid) {
  log.info("deleteUserPreferences: deleting user preferences for %s", userGuid);
  return when.all([
    nodefn.call(del, KeyNamespace.UserPreferences, userGuid),
    nodefn.call(del, KeyNamespace.UserOrgs, userGuid)
  ]);
};
