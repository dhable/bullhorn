/**
 *
 * @module dao.Recipient
 */
var _ = require("lodash"),
    rsvp = require("rsvp"),
    uuid = require("uuid-js"),
    validation = require("./validation.js");


var recipientFields = ["firstName", "lastName", "timeZone", "drains"],
    drainFields = ["type", "verified", "for", "addr", "useSmartDND"];


var findById = function(firebase, recipientId) {
   return new rsvp.Promise(function(accept, reject) {
      firebase.child(recipientId).on("value", function(resultSet) {
         var recipient = resultSet.val();

         if(recipient) {
            recipient.id = recipientId;
            accept(recipient);
            return;
         }

         reject({notFound: true});
      });
   });
};


var save = function(firebase, id, recipient, accept, reject) {
   var validationFailure = validation(recipient, recipientFields) ||
                           validation(recipient.drains, drainFields);

   if(validationFailure) {
      reject(validationFailure);
      return;
   }

   firebase.child(id).set(recipient, function(err) {
      if(!err) {
         var objWithId = _.assign({id: id}, recipient);
         accept(objWithId);
         return;
      }

      reject(err);
   });
};


var create = function(firebase, recipient) {
   return new rsvp.Promise(function(accept, reject) {
      if(recipient.id) {
         reject(new Error("New recipient object should not have an id field."));
         return;
      }

      var id = uuid.create(1).hex;
      save(firebase, id, recipient, accept, reject);
   });
};


var update = function(firebase, recipient) {
   return new rsvp.Promise(function(accept, reject) {
      if(!recipient.id) {
         reject(new Error("Recipient objects need an id before updating."));
         return;
      }

      var id = recipient.id,
          data = _.omit(recipient, "id");

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
