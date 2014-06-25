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

exports.Application = require("./application.js")(store.child("applications"));
exports.ExternalApp = require("./external-app.js")(store.child("external-apps"));
exports.Recipient = require("./recipient.js")(store.child("recipients"));
exports.Log = require("./log.js")(store.child("logs"));
