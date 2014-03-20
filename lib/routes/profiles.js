/**
 * A set of ReSTful APIs that allow for CRUD operations on the user
 * notification profile settings.
 *
 * @module routes/profiles
 */


var noop = function(req, res, next) {
  res.end();
};



/**
 * Public method from the route module that defines the URL patterns
 * and binds them to the functional flow for processing the request.
 *
 * @method bind
 */
exports.bind = function(restifyServer) {
  restifyServer.post({version: "0.1.0", path: "/profiles/"}, noop);
  restifyServer.get({version: "0.1.0", path: "/profiles/:guid"}, noop);
  restifyServer.put({version: "0.1.0", path: "/profiles/:guid"}, noop);
  restifyServer.del({version: "0.1.0", path: "/profiles/:guid"}, noop);
};
