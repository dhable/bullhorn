/**
 * The plumber is the master of all the drains in the system (funny,
 * right). This module contains all the logic for selecting the right
 * drain to use for communication at that moment in time.
 *
 * @module plumber
 */
var _ = require("lodash"),
    async = require("async"),
    dao = require("./dao.js"),
    logger = require("./logger.js"),
    drains = require("./drains");


var log = logger("plumber");


// TODO: This should probably be exposed differently. Instead
//       it could be a validate function that dispatches to each
//       individual drain module.
exports.RecipientTypes = {
  "user": function(idValue) { return true; },
  "org": function(idValue) { return true; },
  "sms": function(idValue) { return true; },
  "email": function(idValue) { return true; }
};


var sendToUser = function(userGuid, msg, template, callback) {
  dao.getUserPreferences(userGuid, function(err, rules) {
    if(err)
      return callback(err);

    var processingExclusiveRules = true;
    rules.forEach(function(rule) {

    });

  });
};


var sendRawMsg = function(drainType, drainId, msg, template, callback) {
  var rawDrain = drains.findDrain(drainType);
  if(!rawDrain)
    return callback(new Error("Failed to find drain " + drainType));

  rawDrain.pour(drainId, msg, template, callback);
};


exports.dispatch = function(options, callback) {
  var to = options.to,
      msg = options.msg,
      template = options.template;

  async.each(to, function(recipient, callback) {
    if(recipient.type == "user")
      return sendToUser(recipient.id, msg, template, callback);

    else if(recipient.type == "org")
      return callback(new Error("sending to org is currently unsupported."));

    else
      return sendRawMsg(recipient.type, recipient.id, msg, template, callback);
  }, callback);
};
