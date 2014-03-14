/*
 * Bullhorn: Get your message heard
 *
 * Copyright (C) 2014 jetway.io. All rights reserved.
 */
var conf = require("./lib/conf.js"),
    logger = require("./lib/logger.js"),
    server = require("./lib/server.js");


// Log a preamble header to the logging system as a test of the
// logging system and to show in the logs where a fresh state occured.
var log = logger("app");
log.info("Bootstrapping jetway.io Bullhorn, version 0.1.0");
log.info("current working directory = %s", process.cwd());


// Create new instances of the services that will be running to handle
// requests.
var port = conf().get("port"),
    api = server();

api.listen(port, function() {
  log.info("API is listening on port %s", port);
});
