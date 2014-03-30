/**
 * The SMS drain takes an inbound notification request and transforms it into a
 * Twilio API call so it can be sent via SMS.
 *
 * @module sms
 */
var _ = require("lodash"),
    twilio = require("twilio"),
    conf = require("../conf.js"),
    statsd = require("../statsd.js"),
    logger = require("../logger.js");


var log = logger("drain.sms"),
    twilioAccountSID = conf.get("twilio.accountSid"),
    twilioAuthToken = conf.get("twilio.authToken"),
    smsFromNumber = conf.get("sms.shortCode");


/**
 * Name of this drain module.
 */
var name = exports.name = "sms";


/**
 * The pour method is the only entry point into putting things into the Drain
 * (pour things down the drain...funny, right).
 */
exports.pour = function(to, message, template, callback) {
  if(!to || !message) {
    return callback(new Error("Missing required parameters to and/or message: arguments = [%s]",
                    _.toArray(arguments).join(", ")));
  }

  var startTime = Date.now(),
      client = twilio(twilioAccountSID, twilioAuthToken),
      twilioReq = {
        to: to,
        from: smsFromNumber,
        body: message };

  client.sendMessage(twilioReq, function(err, resp) {
    var endTime = Date.now(),
        duration = endTime - startTime;

    statsd.recordNotificationProcessed(name,
                                       to.length,
                                       (err ? 0 : 1),
                                       (err ? 1 : 0),
                                       duration);

    if(err) {
      return callback(err);
    }

    log.info("%s sms message to %s (sid = %s)", resp.status, resp.to, resp.sid);
    return callback();
  });

};
