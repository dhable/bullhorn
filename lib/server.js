/**
 * Creates an instance of the restify server.
 *
 * @module server
 */
var fs = require("fs"),
    path = require("path"),
    restify = require("restify"),
    logging = require("./logger.js");


var log = logging("server");


module.exports = function() {
  var restifyServer = restify.createServer({
    name: "bullhorn",
    version: "0.1.0"
  });

  restifyServer.use(restify.gzipResponse());
  restifyServer.use(restify.queryParser());
  restifyServer.use(restify.bodyParser());

  var allRoutes = fs.readdirSync(path.join(__dirname, "routes"));
  allRoutes.forEach(function(route) {
    log.trace("checking %s to see if it's a valid route definition", route);

    var routeModule = require("./routes/" + route);
    if(!routeModule.bind) {
      log.warn("route module %s does not have a bind function. skipping.", route);
    } else {
      log.info("binding route module %s", route);
      routeModule.bind(restifyServer);
    }
  });

  return restifyServer;
};
