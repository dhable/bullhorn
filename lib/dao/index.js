/**
 * Provide access to data objects via the application persistence
 * mechanism.
 *
 * @module dao
 */
var Firebase = require("firebase"),
    conf = require("../conf.js");

var log = require("../logger.js")("dao.index");

var firebaseHost = conf.get("db.firebase.host"),
    firebaseAuthKey = conf.get("db.firebase.authKey"),
    store = new Firebase(firebaseHost);

store.auth(firebaseAuthKey, function(err, result) {
   if(err) {
      log.error("Failed to authenticate to database: %s", err);
      process.exit(1);
   }
});

exports.Domain = require("./domain.js")(store.child("domains"));
exports.ExternalApp = require("./external-app.js")(store.child("external-apps"));
exports.Profile = require("./profile.js")(store.child("profiles"));
exports.Log = require("./log.js")(store.child("logs"));
