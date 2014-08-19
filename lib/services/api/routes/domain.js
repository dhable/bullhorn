/** 
 *
 * @module routes.domain
 */
var crypto = require("crypto"),
    restify = require("restify"),
    uuid = require("node-uuid"),
    _ = require("lodash"),
    dao = require("../../../dao"),
    conf = require("../../../conf.js"),
    security = require("../../../security");


/**
 * Restify request chain handler that knows how to generate a new access token and
 * secret token that can be validated by the common authorization check restify
 * request chain handler.
 */
var generateAPIKey = function(log, conf, req, res, next) {
   var err, 
       salt = conf.get("crypto.salts.apikey"),
       newAccessId, 
       newSecretKey;

   try {
      newAccessId = req.local.newAccessId = uuid.v1();
      newSecretKey = req.local.newSecretKey = security.generateKey(salt, newAccessId);
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


var updateAccessKeyInfo = function(log, conf, req, res, next) {
   var currentDomain = req.local.domain,
       newAccessId = req.local.newAccessId,
       newSecretKey = req.local.newSecretKey;

   currentDomain.accessKey = newAccessId;
   dao.Domain.update(currentDomain)
      .then(function() {
         return dao.AccessKey.create({
            domain: currentDomain.id
         });
      })
      .then(function() {
         req.local.accessId = req.local.newAccessId;
         req.local.secretKey = req.local.newSecretKey;
         next();
      })
      .catch(function(err) {
         log.warn("updateAccessKeyInfo failed. reason: %s", err.message);
         next(new restify.InternalServerError());
      });
};


var returnKeyInfo = function(req, res, next) {
   var accessId = req.local.accessId,
       secretKey = req.local.secretKey;

   res.json({
      accessId: accessId,
      secretKey: secretKey
   });

   next(false);
};


var deleteAPIKey = function(req, res, next) {
   var app = req.local.app;

   dao.ExternalApp.del(app.externalId)
      .then(function() {
         app.externalId = "";
         return dao.Domain.update(app);
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

   server.post({path: "/domains/:domainId/key", version: "1.0.0"},
               common.authorize, common.loadDomain, _.partial(generateAPIKey, log, conf), _.partial(updateAccessKeyInfo, log, conf), returnKeyInfo);

   server.del({path: "/domains/:domainId/key", version: "1.0.0"},
              common.authorize, common.loadDomain, _.partial(deleteAPIKey, log, conf), common.emptyOKChainHandler);

};
