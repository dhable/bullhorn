/**
 * Restify handlers used to manipulate the application resource and set
 * the request state such that other handlers have access to the application
 * information.
 *
 * @module routes.application
 */
var crypto = require("crypto"),
    dao = require("../dao"),
    conf = require("../conf.js");


var log = require("../logger.js")("routes.application");


exports.loadEntity= function(req, res, next) {
   var appId = req.context.appId;

   dao.Application.findById(appId)
      .then(function(application) {
         req.local.app = application;
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


exports.updateEntity = function(req, res, next) {
};


exports.returnKey = function(req, res, next) {
};

