/**
 * The stats group of ReSTful endpoints allow us to query a running node
 * and capture numbers about the data that's been processed over some
 * given point in time.
 *
 * @module stats
 */

var gatherStats = function(req, res, next) {
  // TODO: should start building in some stat capturing
  res.send("I got nothin'");
};



/**
 * Public method from the route module that defines the URL patterns
 * and binds them to the functional flow for processing the request.
 *
 * @method bind
 */
exports.bind = function(restifyServer) {
  restifyServer.get({version: "1.0.0", path: "/stats"}, gatherStats);
};
