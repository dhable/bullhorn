var uuid = require("node-uuid"),
    restify = require("restify"),
    amqplib = require("amqplib"),
    conf = require("../conf.js");


var log = require("../logger.js")("api");


var queueConn;
amqplib.connect(conf.get("pigeon.queue.broker"))
   .then(function(conn) {
      queueConn = conn;
   });


exports.queueNotification = function(req, res, next) {
   log.info("inside queueNotification");

   var id = uuid.v1(),
       payload = JSON.stringify({
      appId: req.local.app.id,
      messageGuid: id,
      to: req.body.to,
      subject: "Test Subject",
      body: req.body.msg,
      domain: req.body.domain
   });

   queueConn.createChannel()
            .then(function(channel) {
               channel.assertQueue("notification");
               channel.sendToQueue("notification", new Buffer(payload));
               req.local.messageGuid = id;
               next();
            })
            .then(null, function(err) {
               log.error("failed to queue notification message - %s", err.message);
               next(new restify.InternalServerError());
            });
};


exports.returnNotification = function(req, res, next) {
   res.json(202, {
      notification: req.local.messageGuid
   });
};
