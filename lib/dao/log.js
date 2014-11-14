/*
 * Bullhorn: Get your message heard
 *
 * Copyright (C) 2014
 * Licensed under the GNU Lesser General Public License v3
 */

/**
 * @module dao.log
 */
var _ = require("lodash"),
    rsvp = require("rsvp"),
    common = require("./common.js");


var logFields = ["endpoint", "success", "requestData", "responseData"];


var create = function(firebase, appId, logEntry) {
   return new rsvp.Promise(function(accept, reject) {
      var timestamp = logEntry.timestamp,
          data = _.omit(logEntry, "timestamp"),
          validationFailure = common.validate(data, logFields);

      if(validationFailure) {
         reject(validationFailure);
         return;
      }

      firebase.child(appId).child(timestamp).set(data, function(err) {
         if(!err) {
            accept(logEntry);
            return;
         }

         reject(err);
      });
   });
};


module.exports = function(firebase) {
   return {
      create: _.curry(create)(firebase)
   };
};
