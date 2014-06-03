/** 
 *
 * @module dao.Application
 */
var rsvp = require("rsvp"),
    uuid = require("uuid-js");


module.exports = function(firebase) {
   return {
      findById: function(appId) {
         return new rsvp.Promise(function(accept, reject) {
            firebase.child(appId).on("value", function(snapshot) {
               if(snapshot.val() === null) {
                  reject({notFound: true});
                  return;
               }

               accept(snapshot.val());
            });
         });
      },

      create: function(name) {
         return new rsvp.Promise(function(accept, reject) {
            var objKey = uuid.create(1).hex;
            firebase.child(objKey).set({appName: name}, function(err) {
               if(err) {
                  reject(err);
                  return;
               }

               accept(objKey);
            });
         });
      }
   };
};
