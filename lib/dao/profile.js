/**
 *
 * @module dao.Recipient
 */
var _ = require("lodash"),
    rsvp = require("rsvp"),
    uuid = require("node-uuid"),
    common = require("./common.js");


var profileFields = ["domain", "firstName", "lastName", "subscriptions"];


var findById = function(firebase, profileId) {
   return new rsvp.Promise(function(accept, reject) {
      firebase.child(profileId).on("value", function(resultSet) {
         var profileObj = resultSet.val();

         if(profileObj) {
            profileObj.id = profileId;
            /*
            profileObj.drains = common.dbDeserializeArray(
               _.map(profileObj.drains, function(o) {
                  o.for = common.dbDeserializeArray(o.for);
                  return o;
               }));
            */
            accept(profileObj);
            return;
         }

         reject({notFound: true});
      });
   });
};


var save = function(firebase, id, profileObj, accept, reject) {
   var validateFailure = common.validate(profileObj, profileFields);

   if(validateFailure) {
      reject(validateFailure);
      return;
   }

   var profileCopy = _.extend({}, profileObj);
   profileCopy.drains = common.dbSerializeArray(
      _.map(profileCopy.drains, function(o) { 
         o.for = common.dbSerializeArray(o.for);
         return o;
      }));
   
   firebase.child(id).set(profileCopy, function(err) {
      if(!err) {
         profileCopy.id = id;
         accept(profileCopy);
         return;
      }

      reject(err);
   });
};


var create = function(firebase, profileObj) {
   return new rsvp.Promise(function(accept, reject) {
      if(profileObj.id) {
         reject(new Error("New Profile object should not have an id field."));
         return;
      }

      var id = uuid.v1();
      save(firebase, id, profileObj, accept, reject);
   });
};


var update = function(firebase, profileObj) {
   return new rsvp.Promise(function(accept, reject) {
      if(!profileObj.id) {
         reject(new Error("Profile objects need an id before updating."));
         return;
      }

      var id = profileObj.id,
          data = _.omit(profileObj, "id");

      save(firebase, id, data, accept, reject);
   });
};


var del = function(firebase, profileId) {
   return new rsvp.Promise(function(accept, reject) {
      firebase.child(profileId).remove(function(err) {
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

      update: _.curry(update)(firebase),

      del: _.curry(del)(firebase)
   };
};
