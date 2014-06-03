/** 
 *
 * @module dao.Application
 */
var rsvp = require("rsvp");

module.exports = function(firebase) {
   return {
      findById: function(appId) {
         return new rsvp.Promise(function(accept, reject) {
            // TODO: Add implementation here
            reject({notFound: true});
         });
      },

      create: function(name) {
         return new rsvp.Promise(function(accept, reject) {
            firebase.set({appName: name, cool: true, times: 1});
         });
      }
   };
};
