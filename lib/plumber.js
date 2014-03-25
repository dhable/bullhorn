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


/**
 * Uses a user's communication preferences to send communication
 * out to a user.
 */
var sendToUser = function(userGuid, msg, template, callback) {
  dao.getUserPreferences(userGuid, function(err, rules) {
    if(err)
      return callback(err);

    var ruleIndex = 0,
        notificationSent = false,
        stopNotificationLoop = true;

    async.whilst(
      function() { return ruleIndex < rules.length && !stopNotificationLoop; },
      function(cb) {
        var drain,
            rule = rules[ruleIndex];

        drain = drains.findDrain(rule.drain);
        if(!drain) {
          log.warn("failed to find drain named %s. skipping drain.", drain);
          return cb();
        }

        drain.pour(userGuid, msg, template, function(err) {
          if(err) {
            log.warn("failed to send notification using %s: %s", drain.name, err);
            return cb();
          }

          if(rule.exclusive || (!rule.exclusive && rules[ruleIndex + 1].exclusive)) {
            stopNotificationLoop = true;
          }

          notificationSent = true;
          ruleIndex++;
          cb();
        });
      },
      function(err) {
        if(err) callback(err);
        else if(!notificationSent) callback(new Error("was unable to dispatch the notification through any rule."));
        else callback();
      });
  });
};


/**
 * Handles the raw messages (those with types of particular drains).
 */
var sendRawMsg = function(drainType, drainId, msg, template, callback) {
  var rawDrain = drains.findDrain(drainType);
  if(!rawDrain)
    return callback(new Error("Failed to find drain " + drainType));

  rawDrain.pour(drainId, msg, template, callback);
};


/**
 * Uses the rules for each recipient to send outbound messages.
 */
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
