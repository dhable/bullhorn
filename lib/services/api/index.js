/**
 *
 */
var socketIO = require("socket.io"),
    restify = require("restify"),
    routes = require("../../routes");

var log = require("../../logger.js")("api");


exports.name = "ReST API";


exports.start = function(conf) {
   var port = conf.get("port"),
       server = restify.createServer({name: "bullhorn", version: "0.1.0"}),
       io = socketIO.listen(server);

   io.configure(function() {
      // io.set("logger", log);
   });

   server.use(restify.gzipResponse());
   server.use(restify.authorizationParser());
   server.use(restify.queryParser());
   server.use(restify.bodyParser());

   routes.bind(server);
   require("../../drains/web.js").bind(io);

   server.listen(port, function() {
      log.trace("API is now listening on port %s", port);
   });
};


exports.stop = function() {
   log.warn("Stop is not implemented on the API service yet.");
};
