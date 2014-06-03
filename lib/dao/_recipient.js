/**
 *
 * @module dao.Recipient
 */
var rsvp = require("rsvp");

module.exports = function(firebase) {
   return {
      find: function(appId, recipientId) {
         return new rsvp.Promise(function(accept, reject) {
            // TODO: Add implementation here
            reject({notFound: true});
         });
      }
   };
};
