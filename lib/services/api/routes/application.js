/**
 * Restify handlers used to manipulate the application resource and set
 * the request state such that other handlers have access to the application
 * information.
 *
 * @module routes.application
 */
var crypto = require("crypto"),
    restify = require("restify"),
    dao = require("../../../dao"),
    conf = require("../../../conf.js");


var log = require("../../../logger.js")("routes.application");


exports.updateEntity = function(req, res, next) {
   dao.Application.update(req.local.app)
      .then(function() {
         next();
      })
      .catch(function(err) {
         next(new restify.InternalServerError());
      });
};
