/**
 * Provide access to data objects via the application persistence
 * mechanism.
 *
 * @module dao
 */
var Firebase = require("firebase"),
    conf = require("../conf.js");


var firebaseUrl = conf.get("db.firebase.url"),
    store = new Firebase(firebaseUrl);


exports.Application = require("./application.js")(store.child("applications"));
exports.ExternalApp = require("./external-app.js")(store.child("external-apps"));
exports.Recipient = require("./recipient.js")(store.child("recipients"));
exports.Log = require("./log.js")(store.child("logs"));
