/**
 * The SMS drain takes an inbound notification request and transforms it into a
 * Twilio API call so it can be sent via SMS.
 *
 * @module sms
 */
var _ = require("lodash"),
    when = require("when"),
    twilio = require("twilio"),
    conf = require("../conf.js"),
    stats = require("../stats.js"),
    logger = require("../logger.js");


var log = logger("drain/sms"),
    statsCollector = new stats.Collector(),
    twilioAccountSID = conf().get("twilio.accountSid"),
    twilioAuthToken = conf().get("twilio.authToken"),
    smsFromNumber = conf().get("sms.shortCode");


/**
 * The pour method is the only entry point into putting things into the Drain
 * (pour things down the drain...funny, right). The pour function returns a
 * promise that can be used to interrogate the state of the operation later
 * on.
 *
 * It's acceptable for this method to throw exceptions.
 */
exports.pour = function(to, message) {
  if(!to || !message) {
    throw new Error("Missing required parameters to and/or message: arguments = [%s]",
                    _.toArray(arguments).join(", "));
  }

  var deferred = when.defer(),
      client = twilio(twilioAccountSID, twilioAuthToken),
      twilioReq = {
        to: to,
        from: smsFromNumber,
        body: message };

  client.sendMessage(twilioReq, function(err, resp) {
    if(err) {
      deferred.reject(err);
      return;
    }

    log.info("%s sms message to %s (sid = %s)", resp.status, resp.to, resp.sid);
    deferred.resolve();
  });

  return deferred.promise;
};
