/**
 * Set of DAO utility functions. This module should not be
 * exported from this package.
 *
 * @private
 */
var _ = require("lodash");


/**
 * Mimics the Firebase serialization scheme used by Ember Data for
 * array objects.
 */
exports.dbSerializeArray = function(array) {
   if(!_.isArray(array)) {
      throw new Error("Input parameter was not an array");
   }


   return _.reduce(array, function(acc, value, index) {
      if(_.isObject(value)) {
         acc[value.id || index] = _.omit(value, "id");
      } else {
         acc[value] = true;
      }
      return acc;
   }, {});
};


/**
 * Mimics the Firebase deserialization scheme used by Emeber Data for
 * array objects.
 */
exports.dbDeserializeArray = function(obj) {
   if(!_.isPlainObject(obj)) {
      throw new Error("Input parameter was not an object");
   }

   return _.reduce(obj, function(acc, value, key) {
      if(_.isBoolean(value) && value) {
         acc.push(key);
      } else if(!isNaN(parseInt(key))) {
         acc.push(value);
      } else if(_.isPlainObject(value)) {
         acc.push(_.extend({id: key}, value));
      }

      return acc;
   }, []);
};
