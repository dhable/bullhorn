/** 
 *
 * @module dao.Application
 */
var _ = require("lodash"),
    rsvp = require("rsvp"),
    uuid = require("uuid-js"),
    validation = require("./validation.js");


var applicationFields = ["name", "env", "externalId", "numRecipients", "numMessages", "channels"],
    channelFields = ["id", "name", "desc", "urgent"];


var findById = function(firebase, appId) {
   return new rsvp.Promise(function(accept, reject) {
      firebase.child(appId).on("value", function(resultSet) {
         var application = resultSet.val();

         if(application) {
            application.id = appId;
            accept(application);
            return;
         }

         reject({notFound: true});
      });
   });
};


var save = function(firebase, id, application, accept, reject) {
   var validationFailure = validation(application, applicationFields) ||
                           _.reduce(application.channels, function(result, channel) { return result || validation(channel, channelFields) }, undefined);

   if(validationFailure) {
      reject(validationFailure);
      return;
   }

   firebase.child(id).set(application, function(err) {
      if(!err) {
         var objWithId = _.assign({id: id}, application);
         accept(objWithId);
         return;
      }

      reject(err);
   });
};


var create = function(firebase, application) {
   return new rsvp.Promise(function(accept, reject) {
      if(application.id) {
         reject(new Error("New application object should not have an id field."));
         return;
      }

      var id = uuid.create(1).hex;
      save(firebase, id, application, accept, reject);
   });
};


var update = function(firbase, application) {
   return new rsvp.Promise(function(accept, reject) {
      if(!application.id) {
         reject(new Error("Application objects need an id before updating."));
         return;
      }

      var id = application.id,
          data = _.omit(application, "id");

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
