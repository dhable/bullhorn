/*
 * Bullhorn: Get your message heard
 *
 * Copyright (C) 2014
 * Licensed under the GNU Lesser General Public License v3
 */


/**
 *
 */
var restify = require("restify");


var log = require("../../logger.js")("api");


exports.name = "ReST API";


exports.start = function(conf) {
   var port = conf.get("port"),
       common = require("./common.js")(log, conf),
       server = restify.createServer({name: "bullhorn", version: "0.1.0"});

   log.debug("initializing restify middleware functions");
   server.use(restify.gzipResponse());
   server.use(restify.authorizationParser());
   server.use(restify.queryParser());
   server.use(restify.bodyParser());
   server.use(common.requestLocalStorage);
   server.use(common.setStartTime);

   // Setup some custom hooks on various restify actions. These are used
   // for monitoring, redirecting and provide better error responses
   // so it doesn't look so much like restify.
   log.debug("setting up restify event handlers");
   server.on("NotFound", common.redirect("http://dev.jetway.io"));
   server.on("after", common.emitOpStats);
   server.on("uncaughtException", common.trapUncaughtException);

   // Load each of the API modules into the server.
   log.debug("bindig application routes to restify server");
   require("./domain.js").init(server, log, conf);
   require("./profile.js").init(server, log, conf);
   require("./notification.js").init(server, log, conf);
   
   log.debug("attempting to listen on port %s", port);                      
   server.listen(port, function() {
      log.debug("listening on port %s successful", port);
   });
};


exports.stop = function() {
   server.close();
};
