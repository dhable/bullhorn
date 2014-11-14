/*
 * Bullhorn: Get your message heard
 *
 * Copyright (C) 2014
 * Licensed under the GNU Lesser General Public License v3
 */

/** 
 * @module dao.Domain
 */
var _ = require("lodash"),
    rsvp = require("rsvp"),
    uuid = require("node-uuid"),
    common = require("./common.js");


var domainFields = ["name", "env", "accessKeys", "numRecipients", "numMessages", "channels", "profiles"],
    channelFields = ["id", "name", "desc", "urgent"];


var findById = function(firebase, domainId) {
   return new rsvp.Promise(function(accept, reject) {
      firebase.child(domainId).on("value", function(resultSet) {
         var domainObj = resultSet.val();

         if(domainObj) {
            domainObj.id = domainId;
            domainObj.accessKeys = common.dbDeserializeArray(domainObj.accessKeys);
            domainObj.profiles = common.dbDeserializeArray(domainObj.profiles);
            domainObj.channels = common.dbDeserializeArray(domainObj.channels);

            accept(domainObj);
            return;
         }

         reject({notFound: true});
      });
   });
};


var save = function(firebase, id, domainObj, accept, reject) {
   var validateFailure = common.validate(domainObj, domainFields) ||
                         _.reduce(domainObj.channels, function(result, channel) { return result || common.validate(channel, channelFields); }, undefined);

   if(validateFailure) {
      reject(validateFailure);
      return;
   }

   var domainCopy= _.extend(domainObj);
   domainObj.accessKeys = common.dbSerializeArray(domainObj.accessKeys);
   domainCopy.profiles = common.dbSerializeArray(domainCopy.profiles);
   domainCopy.channels = common.dbSerializeArray(domainCopy.channels);

   firebase.child(id).set(domainCopy, function(err) {
      if(!err) {
         domainCopy.id = id;
         accept(domainCopy);
         return;
      }

      reject(err);
   });
};


var create = function(firebase, domainObj) {
   return new rsvp.Promise(function(accept, reject) {
      if(domainObj.id) {
         reject(new Error("New Domain object should not have an id field."));
         return;
      }

      var id = uuid.v1();
      save(firebase, id, domainObj, accept, reject);
   });
};


var update = function(firebase, domainObj) {
   return new rsvp.Promise(function(accept, reject) {
      if(!domainObj.id) {
         reject(new Error("Domain objects need an id before updating."));
         return;
      }

      var id = domainObj.id,
          data = _.omit(domainObj, "id");

      save(firebase, id, data, accept, reject);
   });
};


module.exports = function(firebase) {
   return {
      findById: _.curry(findById)(firebase),

      create: _.curry(create)(firebase),

      update: _.curry(update)(firebase)
   };
};
