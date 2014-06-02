/**
 * Restify handlers used to manipulate the application resource and set
 * the request state such that other handlers have access to the application
 * information.
 *
 * @module routes.application
 */
var logger = require("../logger.js"),
    dao = require("../dao");


var log = logger("routes.application");


exports.loadApplication = function(req, res, next) {
   var appId = req.context.appId;

   dao.Application.findById(appId)
      .then(function(application) {
         // TODO: Add application data to request
         return next();
      })
      .catch(function(err) {
         if(err.notFound) {
            res.json(404, {message: ""});
            return res.end();
         }

         log.error("Unhandled err looking up application by id.", err);
         res.json(500, {message: ""});
         return res.end();
      });
};
