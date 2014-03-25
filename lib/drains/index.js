/**
 *
 */
var _ = require("lodash");


// We may want to enable/disable this through configuration.
var activeDrains = [require("./web.js"), require("./email.js"), require("./sms.js")];


/**
 *
 */
exports.findDrain = function(name) {
  return _.findWhere(activeDrains, {name: name});
};
