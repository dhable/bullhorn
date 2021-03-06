/*
 * Bullhorn: Get your message heard
 *
 * Copyright (C) 2014
 * Licensed under the GNU Lesser General Public License v3
 */

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
exports.AccessKey= require("./accesskey.js")(store.child("accesskeys"));
exports.Profile = require("./profile.js")(store.child("profiles"));
exports.Log = require("./log.js")(store.child("logs"));
