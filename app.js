/*
 * Bullhorn: Get your message heard
 *
 * Copyright (C) 2014 jetway.io. All rights reserved.
 */
var conf = require("./lib/conf.js"),
    log = require("./lib/logger.js")("boot");


// Log a preamble header to the logging system as a test of the
// logging system and to show in the logs where a fresh state occured.
log.info("Bootstrapping jetway.io Bullhorn, version 0.1.0");
log.info("current working directory = %s", process.cwd());


var services = [ 
   require("./lib/services/api"),
   require("./lib/services/pigeon")
];

services.forEach(function(service) {
   var start = Date.now();

   try {
      log.info("attempting start of %s", service.name);
      service.start(conf);
   }
   catch(err) {
      log.error("failed to start %s [message = %s]", service.name, err.message);
      // TODO: Emit alarm that service failed to start
   }

   log.debug("service start execution for %s took %s ms", service.name, Date.now() - start);
});


process.once("SIGINT", function() {
   try {
      services.forEach(function(service) {
         service.stop();
      });
   }
   catch(err) {
      // eat the error
   }
});
