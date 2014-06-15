/**
 *
 * @module dao.external-app
 */
var _ = require("lodash"),
    rsvp = require("rsvp"),
    uuid = require("uuid-js"),
    validation = require("./validation.js");


var externalAppFields = ["appId"];


var findById = function(firebase, externalId) {
   return new rsvp.Promise(function(accept, reject) {
      firebase.child(externalId).on("value", function(resultSet) {
         var externalApp = resultSet.val();

         if(externalApp) {
            externalApp.id = externalId;
            accept(externalApp);
            return;
         }

         reject({notFound: true});
      });
   });
};


var save = function(firebase, id, externalApp, accept, reject) {
   var validationFailure = validation(externalApp, externalAppFields);

   if(validationFailure) {
      reject(validationFailure);
      return;
   }

   firebase.child(id).set(externalApp, function(err) {
      if(!err) {
         var objWithId = _.assign({id: id}, externalApp);
         accept(objWithId);
         return;
      }

      reject(err);
   });
};


var create = function(firebase, externalApp) {
   return new rsvp.Promise(function(accept, reject) {
      if(externalApp.id) {
         reject(new Error("New externalApp object should not have an id field."));
         return;
      }

      var id = uuid.create(1).hex;
      save(firebase, id, externalApp, accept, reject);
   });
};


var del = function(firebase, externalAppId) {
   return new rsvp.Promise(function(accept, reject) {
      firebase.child(externalAppId).remove(function(err) {
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
      findById: _.curry(findById)(firebase),

      create: _.curry(create)(firebase),

      del: _.curry(del)(firebase)
   };
};
