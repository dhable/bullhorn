/**
 * Includes all the code required for the health check ReST API
 * endpoint. All versions of the API should continue to live in
 * this module.
 *
 * @module routes/health
 */

var computeServerHealth = function(req, res, next) {
  res.json({
    health: 0.1
  });

  return next();
};



/**
 * Public method from the route module that defines the URL patterns
 * and binds them to the functional flow for processing the request.
 *
 * @method bind
 */
exports.bind = function(restifyServer) {
  restifyServer.get({version: "0.1.0", path: "/health"}, computeServerHealth);
};
