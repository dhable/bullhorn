/**
 *
 * @module dao.validation
 */
var _ = require("lodash");


module.exports = function(obj, fields) {
   if(!obj) {
      return new Error("object is null or undefined.");
   }

   if(!_.isPlainObject(obj)) {
      return new Error("object is not a plain object.");
   }

   var objKeys = _.keys(obj),
       extraFields = _.difference(objKeys, fields),
       missingFields = _.difference(fields, objKeys);

   if(extraFields.length) {
      return new Error("object contains additional fields. [" + extraFields.join(", ") + "]");
   }

   if(missingFields.length) {
      return new Error("object missing required fields. [" + missingFields.join(", ") + "]");
   }
};
