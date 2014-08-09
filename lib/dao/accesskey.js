/**
 *
 * @module dao.accesskey
 */
var _ = require("lodash"),
    rsvp = require("rsvp"),
    common = require("./common.js");


var accessKeyFields = ["domain"];


var findById = function(firebase, accessKeyId) {
   return new rsvp.Promise(function(accept, reject) {
      firebase.child(accessKeyId).on("value", function(resultSet) {
         var accessKeyObj = resultSet.val();

         if(accessKeyObj) {
            accessKeyObj.id = accessKeyId;
            accept(accessKeyObj);
            return;
         }

         reject({notFound: true});
      });
   });
};


var save = function(firebase, id, accessKeyObj, accept, reject) {
   var validateFailure = common.validate(accessKeyObj, accessKeyFields);

   if(validateFailure) {
      reject(validateFailure);
      return;
   }

   var accessKeyCopy = _.extend({}, accessKeyObj);

   firebase.child(id).set(accessKeyCopy, function(err) {
      if(!err) {
         accessKeyCopy.id = id;
         accept(accessKeyCopy);
         return;
      }

      reject(err);
   });
};


var create = function(firebase, accessKeyObj) {
   return new rsvp.Promise(function(accept, reject) {
      var id = accessKeyObj.id;
      save(firebase, id, _.omit(accessKeyObj, "id"), accept, reject);
   });
};


var del = function(firebase, accessKeyId) {
   return new rsvp.Promise(function(accept, reject) {
      firebase.child(accessKeyId).remove(function(err) {
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
