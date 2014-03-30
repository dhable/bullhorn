/**
 * The Email drain takes an notification request and transforms it into a
 * SendGrid Email API request so the notification can be sent via email.
 *
 * @module email
 */
var _ = require("lodash"),
    sendgrid = require("sendgrid"),
    conf = require("../conf.js"),
    statsd = require("../statsd.js"),
    logger = require("../logger.js");


var log = logger("drain.email"),
    sendGridUser = conf.get("sendgrid.user"),
    sendGridKey = conf.get("sendgrid.key"),
    emailFromAddr = conf.get("email.from");


/**
 * Name of this drain module.
 */
var name = exports.name = "email";


/**
 * The pour method is the only entry point into putting things into the Drain
 * (pour things down the drain...funny, right).
 *
 * @param callback(err)
 */
exports.pour = function(to, message, template, callback) {
  if(!to || !message) {
    return callback(new Error("Missing required parameters to and/or message: arguments = [%s]",
                    _.toArray(arguments).join(", ")));
  }

  var startTime = Date.now(),
      client = sendgrid(sendGridUser, sendGridKey),
      email = new client.Email({
        to: to,
        from: emailFromAddr,
        subject: "jetway.io Notification",
        text: message
      });

  client.send(email, function(err, resp) {
    var endTime = Date.now(),
        duration = endTime - startTime;

    statsd.recordNotificationProcessed(name,
                                       1,
                                       (err ? 0 : 1)
                                       (err ? 1 : 0),
                                       duration);

    if(err) {
      return callback(err);
    }

    log.info("email notification sent to %s (took = %s ms)", to, duration);
    return callback();
  });

};
