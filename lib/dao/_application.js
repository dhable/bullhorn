/** 
 *
 * @module dao.Application
 */
var rsvp = require("rsvp");

exports.findById = function(appId) {
   return new rsvp.Promise(function(accept, reject) {
      // TODO: Add implementation here
      reject({notFound: true});
   });
};
