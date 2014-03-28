/**
 *
 */
var _ = require("lodash");


// We may want to enable/disable this through configuration.
var activeDrains = [require("./web.js"), require("./email.js"), require("./sms.js")];


/**
 * Locates a drain by name from all active drains in the system.
 * Returns an instance of the module if it exists, otherwise it
 * returns undefined.
 */
exports.findDrain = function(name) {
  return _.findWhere(activeDrains, {name: name});
};



/**
 * Returns a array of all the active drains in the system.
 */
exports.getActiveDrains = function() {
  return activeDrains;
};
