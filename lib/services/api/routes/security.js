/** 
 *
 * @module routes.security
 */
var crypto = require("crypto"),
    restify = require("restify"),
    uuid = require("node-uuid"),
    dao = require("../../../dao"),
    conf = require("../../../conf.js"),
    security = require("../../../security");


var log = require("../../../logger.js")("routes.security");


/**
 * Restify handler function that ensures the request is from an authorized source
 * for the API being called. This handler and any functions it calls should not include
 * a dependency on the database to ensure that we fail unauthorized attempts fast and
 * without spending resources. This will help us weather an attack on the API.
 *
 * @param req The restify request object
 * @param res The restify response object
 * @param next The restify continuation function
 */
exports.authorize = function(req, res, next) {
   var salt = conf.get("crypto.salts.apikey"),
       appId = req.context.appId,
       apiKey = req.authorization;

   if(apiKey && apiKey.scheme === "X-Jetway-API-Key" && security.isKeyValid(salt, appId, apiKey.credentials)) {
      return next();
   } else {
      return next(new restify.UnauthorizedError());
   }
};


/**
 * Restify chain piece to generate a new API key from a given external application ID.
 */
exports.generateAPIKey = function(req, res, next) {
   var err, 
       salt = conf.get("crypto.salts.apikey"),
       newExternalId, 
       newSecretKey;

   try {
      newExternalId = req.local.newExternalId = uuid.v1();
      newSecretKey = req.local.newSecretKey = generateKey(salt, newExternalId);
      if(!newSecretKey) {
         log.warn("generated secret key is falsey or an empty string. val: %s", newSecretKey);
         err = new restify.InternalServerError();
      }
   } catch(ex) {
      log.warn("generateKey failed. reason: %s", ex.message);
      err = new restify.InternalServerError();
   }

   return next(err);
};


exports.updateAppKeyInfo = function(req, res, next) {
   var currentApp = req.local.app,
       oldExternalId = currentApp.externalId,
       newExternalId = req.local.newExternalId,
       newSecretKey = req.local.newSecretKey;

   currentApp.externalId = newExternalId;
   dao.Application.update(currentApp)
      .then(function() {
         return dao.ExternalApp.create({
            id: newExternalId,
            appId: currentApp.id
         });
      })
      .then(function() {
         // Doesn't matter if it fails. We if so, we have something for out 
         // batch clean up utility to do.
         dao.ExternalApp.del(oldExternalId);

         req.local.externalId = req.local.newExternalId;
         req.local.secretKey = req.local.newSecretKey;
         next();
      })
      .catch(function(err) {
         log.warn("updateAppKeyInfo failed. reason: %s", err.message);
         next(new restify.InternalServerError());
      });
};


exports.returnKeyInfo = function(req, res, next) {
   var externalId = req.local.externalId,
       secretKey = req.local.secretKey;

   res.json({
      appId: externalId,
      secretKey: secretKey
   });

   next(false);
};


exports.deleteAPIKey = function(req, res, next) {
   var app = req.local.app;

   dao.ExternalApp.del(app.externalId)
      .then(function() {
         app.externalId = "";
         return dao.Application.update(app);
      })
      .then(function() {
         next();
      })
      .catch(function(err) {
         log.warn("deleteAPIKey failed. reason: %s", err.message);
         next(new restify.InternalServerError());
      });
};





