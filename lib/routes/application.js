/**
 * Restify handlers used to manipulate the application resource and set
 * the request state such that other handlers have access to the application
 * information.
 *
 * @module routes.application
 */
var crypto = require("crypto"),
    restify = require("restify"),
    dao = require("../dao"),
    conf = require("../conf.js");


var log = require("../logger.js")("routes.application");


exports.loadApplication = function(req, res, next) {
   var appId = req.context.appId;

   dao.Application.findById(appId)
      .then(function(application) {
         req.local.app = application;
         return next();
      })
      .catch(function(err) {
         if(err.notFound) {
            return next(new restify.NotFoundError());
         } else {
            log.error("unhandled err looking up application by id. reason: %s", err);
            return next(new restify.InternalServerError());
         }
      });
};


exports.updateEntity = function(req, res, next) {
   dao.Application.update(req.local.app)
      .then(function() {
         next();
      })
      .catch(function(err) {
         next(new restify.InternalServerError());
      });
};
