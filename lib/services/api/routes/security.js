/** 
 *
 * @module routes.security
 */
var crypto = require("crypto"),
    restify = require("restify"),
    uuid = require("node-uuid"),
    _ = require("lodash"),
    dao = require("../../../dao"),
    conf = require("../../../conf.js"),
    security = require("../../../security");


/**
 * Restify chain piece to generate a new API key from a given external application ID.
 */
var generateAPIKey = function(log, conf, req, res, next) {
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


var updateAppKeyInfo = function(log, conf, req, res, next) {
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


var returnKeyInfo = function(req, res, next) {
   var externalId = req.local.externalId,
       secretKey = req.local.secretKey;

   res.json({
      appId: externalId,
      secretKey: secretKey
   });

   next(false);
};


var deleteAPIKey = function(req, res, next) {
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


exports.init = function(server, log, conf) {
   var common = require("./common.js")(log, conf);

   server.post({path: "/applications/:appId/key", version: "1.0.0"},
               common.authorize, common.loadApplication, _.partial(generateAPIKey, log, conf), _.partial(updateAppKeyInfo, log, conf), returnKeyInfo);

   server.del({path: "/applications/:appId/key", version: "1.0.0"},
              common.authorize, common.loadApplication, _.partial(deleteAPIKey, log, conf), common.emptyOKChainHandler);
};
