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


exports.Application = require("./_application.js")(store.child("applications"));
exports.Recipient = require("./_recipient.js")(store.child("recipients"));
