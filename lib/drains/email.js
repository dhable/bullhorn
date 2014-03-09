/**
 * The Email drain takes an notification request and transforms it into a
 * SendGrid Email API request so the notification can be sent via email.
 *
 * @module email
 */
var _ = require("lodash"),
    when = require("when"),
    sendgrid = require("sendgrid"),
    conf = require("../conf.js"),
    logger = require("../logger.js"),
    base = require("./base.js");


var log = logger("drain/email"),
    sendGridUser = conf().get("sendgrid.user"),
    sendGridKey = conf().get("sendgrid.key"),
    emailFromAddr = conf().get("email.from");


/**
 * The drain class is the primary object used to send messages out via emails.
 * The system is allowed to make multiple instances of the Drain object as
 * load increases so you should avoid accessing mutable state in the rest
 * of the module. Any mutuable state should be contained within the object.
 *
 * @class Drain
 */
var Drain = exports.Drain = base.extend(function() {
  this.foo = "it worked";
  return this;
});


/**
 * The pour method is the only entry point into putting things into the Drain
 * (pour things down the drain...funny, right). The pour function returns a
 * promise that can be used to interrogate the state of the operation later
 * on.
 *
 * It's acceptable for this method to throw exceptions.
 *
 * @method pour
 */
Drain.prototype.pour = function(to, message) {
  if(!to || !message) {
    throw new Error("Missing required parameters to and/or message: arguments = [%s]",
                    _.toArray(arguments).join(", "));
  }

  var deferred = when.defer(),
      client = sendgrid(sendGridUser, sendGridKey),
      email = new client.Email({
        to: to,
        from: emailFromAddr,
        subject: "jetway.io Notification",
        text: message
      });

  client.send(email, function(err, resp) {
    if(err) {
      deferred.reject(err);
      return;
    }

    log.info("email notification sent to %s", to);
    deferred.resolve();
  });

  return deferred.promise;
};
