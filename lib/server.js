/**
 * Creates an instance of the restify server.
 *
 * @module server
 */
var restify = require("restify");


module.exports = function() {
  var restifyServer = restify.createServer({
    name: "bullhorn",
    version: "0.1.0"
  });

  restifyServer.use(restify.gzipResponse());
  restifyServer.use(restify.queryParser());
  restifyServer.use(restify.bodyParser());

  // TODO: Connect API routes here

  return restifyServer;
};
