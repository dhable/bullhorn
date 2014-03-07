/**
 * Implementation of the v1 ReST API for the bullhorn service. Once
 * deployed, the code in this file should remain constant.
 *
 * @module routes/v1
 */

var VERSION = "1.0.0";

var noopFunction = function(req, res, next) {
  return next();
};


/**
 * Public method from the route module that defines the URL patterns
 * and binds them to the functional flow for processing the request.
 *
 * @method bind
 */
exports.bind = function(restifyServer) {

  // Path for posting a new outbound message for a given user
  restifyServer.post({version: VERSION, path: "/user/:userId/messages"}, noopFunction);

  // Path for fetching health stats about the server
  restifyServer.get({version: VERSION, path: "/health?detailed=:detailed"}, noopFunction);

  // Path for fetching the notification send statistics
  restifyServer.get({version: VERSION, path: "/stats?last=:hours"}, noopFunction);
};
