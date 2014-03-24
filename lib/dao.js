/**
 * Contains all the raw data storage logic.
 */
var _ = require("lodash"),
    levelup = require("levelup"),
    conf = require("./conf.js"),
    logger = require("./logger.js");


var dbFilePath = conf().get("db"),
    db = levelup(dbFilePath, {valueEncoding: "json"}),
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
  // Compiled Template Definitions - these should only be used
  // in the context of the KeyNamespace object.
  _userPreferenceTemplate: _.template("user:<%= guid %>:pref"),
  _userMemberOfTemplate: _.template("user:<%= guid %>:memberOf"),
  _orgUserAssocTemplate: _.template("org:<%= id %>:<%= guid %>"),

  UserPreferences: function(userGuid) {
    return this._userPreferenceTemplate({guid: userGuid});
  },

  UserMemberOf: function(userGuid) {
    return this._userMemberOfTemplate({guid: userGuid});
  },

  OrgUserAssoc: function(orgId, userGuid) {
    return this._orgUserAssocTemplate({id: orgId, guid: userGuid});
  }
};


/**
 * Builds an association between a user and an org. With this association
 * the user will now be included on notifications that are sent to an org.
 *
 * @param userGuid The id of the user entity.
 * @param orgIds An array of org ids to associate the user with.
 * @callback
 */
exports.associateUserWithOrgs = function(userGuid, orgIds, callback) {
  log.info("associateUserWithOrgs: assocating user %s with org(s) %s", userGuid, orgIds);
  db.get(KeyNamespace.UserMemberOf(userGuid), function(err, memberOfList) {
    if(err) {
      if(err.notFound) {
        memberOfList = [];
      } else {
        return callback(err);
      }
    }

    var i,
        now = Date.now(),
        operations = [];


    operations.push({type: 'put', key: KeyNamespace.UserMemberOf(userGuid), value: _.union(memberOfList, orgIds)});
    for(i = 0; i < orgIds.length; i++) {
      operations.push({type: 'put', key: KeyNamespace.OrgUserAssoc(orgIds[i], userGuid), value: {on: now} });
    }

    db.batch(operations, {sync: true}, callback);
  });
};


/**
 * Breaks an association between a user and an org.
 *
 * @param userGuid The id of the user entity.
 * @param orgId The id of the org entity.
 * @param callback
 */
exports.disassociateUserWithOrgs = function(userGuid, orgIds, callback) {
  log.info("disassociateUserWithOrgs: disassocating user %s with orgId(s) %s", userGuid, orgIds);
  db.get(KeyNamespace.UserMemberOf(userGuid), function(err, memberOfList) {
    if(err)
      return callback(err);

    var i, operations;

    operations = [{
      type: 'put',
      key: KeyNamespace.UserMemberOf(userGuid),
      value: _.difference(memberOfList, orgId)
    }];

    for(i = 0; i < orgIds.length; i++) {
      operations.push({type: 'del', key: KeyNamespace.OrgUserAssoc(orgIds[i], userGuid) });
    }

    db.batch(operations, {sync: true}, callback);
  });
};


/**
 * Performs a lookup of all the orgs that a given user is associated with.
 * When the promise is resolved, the first argument will be an array of
 * org ids.
 *
 * @param userGuid The id of the user entity.
 * @param callback
 */
exports.fetchAssociatedOrgs = function(userGuid, callback) {
  log.info("fetchAssociatedOrgs: fetching org associations for user %s", userGuid);
  db.get(KeyNamespace.UserMemberOf(userGuid), callback);
};


/**
 * Save a new or updated user preference objct array in the database.
 *
 * @param userGuid The id of the user entity.
 * @param preferences The array of notification preference objects.
 * @param callback
 */
exports.saveUserPreferences = function(userGuid, preferences, callback) {
  log.info("updateUserPreferences: saving preferences for %s", userGuid);
  db.put(KeyNamespace.UserPreferences(userGuid), preferences, callback);
};


/**
 * Performs a lookup of the user notification preferences in the database.
 * The result will be available as the first argument to the promise when
 * resolved.
 *
 * @param userGuid The id of the user entity.
 * @param callback
 */
exports.getUserPreferences = function(userGuid, callback) {
  log.info("getUserPreferences: fetch user preferences for %s", userGuid);
  db.get(KeyNamespace.UserPreferences(userGuid), callback);
};


/**
 * Removes a user notification preference block in the database. Since
 * our data store is not relational, this method will not remove the
 * user associations to orgs in the database.
 *
 * @param userGuid The id of the user entity.
 * @callback
 */
exports.deleteUserPreferences = function(userGuid, callback) {
  log.info("deleteUserPreferences: deleting user preferences for %s", userGuid);
  db.get(KeyNamespace.UserMemberOf(userGuid), function(err, memberOfList) {
    if(err)
      return callback(err);

    var operations = [
      {type: 'del', key: KeyNamespace.UserPreferences(userGuid) },
      {type: 'del', key: KeyNamespace.UserMemberOf(userGuid)}
    ];

    for(var i = 0; i < memberOfList.length; i++) {
      operations.push({
        type: 'del',
        key: KeyNamespace.OrgUserAssoc(memberOfList[i], userGuid)
      });
    }

    db.batch(operations, {sync: true}, callback);
  });
};
