/**
 *
 * @module routes.recipient
 */
var restify = require("restify"),
    dao = require("../dao");


var log = require("../logger.js")("routes.recipient");


exports.createRecipient = function(req, res, next) {
   if(!req.local.app) {
      log.error("createRecipient: application object not loaded in request local storage");
      return next(new restify.InternalServerError());
   }

};


