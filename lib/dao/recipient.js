/**
 *
 * @module dao.Recipient
 */
var _ = require("lodash"),
    rsvp = require("rsvp"),
    uuid = require("node-uuid"),
    common = require("./common.js"),
    validation = require("./validation.js");


var recipientFields = ["firstName", "lastName", "timeZone", "drains"],
    drainFields = ["addr", "type", "verified", "for"];


var all = function(firebase, appId) {
   return new rsvp.Promise(function(accept, reject) {
      firebase.child(appId).on("value", function(resultSet) {
         var recipientList = resultSet.val();

         if(!recipientList) {
            recipientList = [];
         }

         accept(recipientList);
      });
   });
};


var findById = function(firebase, appId, recipientId) {
   return new rsvp.Promise(function(accept, reject) {
      firebase.child(appId).child(recipientId).on("value", function(resultSet) {
         var recipient = resultSet.val();

         if(recipient) {
            recipient.id = recipientId;
            recipient.drains = common.dbDeserializeArray(
               _.map(recipients.drains, function(o) {
                  o.for = common.dbDeserializeArray(o.for);
                  return o;
               }));
            accept(recipient);
            return;
         }

         reject({notFound: true});
      });
   });
};


var save = function(firebase, appId, id, recipient, accept, reject) {
   var validationFailure = validation(recipient, recipientFields) ||
                           _.reduce(recipient.drains, function(result, drain) { return result || validation(drain, drainFields); }, undefined);

   if(validationFailure) {
      reject(validationFailure);
      return;
   }

   var recipientCopy = _.extend({}, recipient);
   recipientCopy.drains = common.dbSerializeArray(
      _.map(recipientCopy.drains, function(o) { 
         o.for = common.dbSerializeArray(o.for);
         return o;
      }));
   
   firebase.child(appId).child(id).set(recipientCopy, function(err) {
      if(!err) {
         var objWithId = _.assign({id: id}, recipient);
         accept(objWithId);
         return;
      }

      reject(err);
   });
};


var create = function(firebase, appId, recipient) {
   return new rsvp.Promise(function(accept, reject) {
      if(recipient.id) {
         reject(new Error("New recipient object should not have an id field."));
         return;
      }

      var id = uuid.v1();
      save(firebase, appId, id, recipient, accept, reject);
   });
};


var update = function(firebase, appId, recipient) {
   return new rsvp.Promise(function(accept, reject) {
      if(!recipient.id) {
         reject(new Error("Recipient objects need an id before updating."));
         return;
      }

      var id = recipient.id,
          data = _.omit(recipient, "id");

      save(firebase, appId, id, data, accept, reject);
   });
};


var del = function(firebase, appId, recipientId) {
   return new rsvp.Promise(function(accept, reject) {
      firebase.child(appId).child(recipientId).remove(function(err) {
         if(!err) {
            accept();
            return;
         }
         
         reject(err);
      });
   });
};


module.exports = function(firebase) {
   return {
      all: _.curry(all)(firebase),

      findById: _.curry(findById)(firebase),

      create: _.curry(create)(firebase),

      update: _.curry(update)(firebase),

      del: _.curry(del)(firebase)
   };
};
