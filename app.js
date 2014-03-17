/*
 * Bullhorn: Get your message heard
 *
 * Copyright (C) 2014 jetway.io. All rights reserved.
 */
var socketIO = require("socket.io"),
    restify = require("restify"),
    conf = require("./lib/conf.js"),
    logger = require("./lib/logger.js"),
    routes = require("./lib/routes");


// Log a preamble header to the logging system as a test of the
// logging system and to show in the logs where a fresh state occured.
var log = logger("app");
log.info("Bootstrapping jetway.io Bullhorn, version 0.1.0");
log.info("current working directory = %s", process.cwd());


// Create new instances of the services that will be running to handle
// requests.
var port = conf().get("port"),
    server = restify.createServer({name: "bullhorn", version: "0.1.0"}),
    io = socketIO.listen(server);

io.configure(function() {
  io.set("logger", logger("socket.io"));
});

server.use(restify.gzipResponse());
server.use(restify.queryParser());
server.use(restify.bodyParser());

routes.bind(server);
require("./lib/drains/web.js").bind(io);

server.listen(port, function() {
  log.info("bullhorn is now ready and listening on port %s", port);
});
