/**
 *
 */
var restify = require("restify");


var log = require("../../logger.js")("api");


exports.name = "ReST API";


exports.start = function(conf) {
   var port = conf.get("port"),
       common = require("./common.js")(log, conf),
       Null = common.emptyOkChainHandler,
       server = restify.createServer({name: "bullhorn", version: "0.1.0"});

   server.use(restify.gzipResponse());
   server.use(restify.authorizationParser());
   server.use(restify.queryParser());
   server.use(restify.bodyParser());

   // Setup some custom hooks on various restify actions. These are used
   // for monitoring, redirecting and provide better error responses
   // so it doesn't look so much like restify.
   server.on("NotFound", common.redirect("http://dev.jetway.io"));
   server.on("after", common.emitOpStats);
   server.on("uncaughtException", common.trapUncaughtException);

   // Create a new local storage object that can be used to pass values
   // between restify middleware functions.
   server.use(common.requestLocalStorage);
   server.use(common.setStartTime);

   // Load each of the API modules into the server.
   require("./domain.js").init(server, log, conf);
   require("./profile.js").init(server, log, conf);
   require("./notification.js").init(server, log, conf);
                      
   server.listen(port, function() {
      log.trace("API is now listening on port %s", port);
   });
};


exports.stop = function() {
   server.close();
};
