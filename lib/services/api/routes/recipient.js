/**
 *
 * @module routes.recipient
 */
var _ = require("lodash"),
    restify = require("restify"),
    dao = require("../../../dao");


var createRecipient = function(log, req, res, next) {
   if(!req.local.app) {
      log.error("createRecipient: application object not loaded in request local storage");
      return next(new restify.InternalServerError());
   }

   if(!req.body) {
      return next(new restify.BadRequestError());
   }

   dao.Recipient.create(req.local.app.id, req.body)
      .then(function(storedObj) {
         res.json({
            guid: storedObj.id
         });

         next(false);
      })
      .catch(function(err) {
         log.warn("createRecipient: faild to create object. reason: %s", err.message);
         next(new restify.InternalServerError());
      });
};


var loadRecipient = function(log, req, res, next) {
   var app = req.local.app,
       recipientId = req.context.recipientId;

   if(!req.local.app) {
      log.error("createRecipient: application object not loaded in request local storage");
      return next(new restify.InternalServerError());
   }

   dao.Recipient.findById(app.id, recipientId)
      .then(function(recipient) {
         req.local.recipient = recipient;
         next();
      })
      .catch(function(err) {
         if(err.notFound) {
            next(new restify.NotFoundError());
         } else {
            log.error("unhandled err looking up recipient by id. reason: %s", err.message);
            next(new restify.InternalServerError());
         }
      });
};


var loadAllRecipients = function(log, req, res, next) {
   var app = req.local.app;

   if(!req.local.app) {
      log.error("loadAllRecipients: application object not loaded in request local storage");
      return next(new restify.InternalServerError());
   }

   dao.Recipient.all(app.id)
      .then(function(recipientList) {
         req.local.recipientList = recipientList;
         next();
      })
      .catch(function(err) {
         log.error("unhandled error looking up recipient list. reason: %s", err.message);
         next(new restify.InternalServerError());
      });
};


var returnRecipient = function(req, res, next) {
   var recipient = req.local.recipient;

   res.json(recipient);
   next(false);
};


var returnAllRecipients = function(req, res, next) {
   var recipientList = req.local.recipientList;

   res.json(recipientList);
   next(false);
};


var updateRecipient = function(log, req, res, next) {
   var app = req.local.app,
       recipient = req.local.recipient,
       updatedRecipient = req.body;

   updatedRecipient.id = recipient.id;
   dao.Recipient.update(app.id, updatedRecipient)
      .then(function(dbRecipient) {
         req.local.recipient = dbRecipient;
         next();
      })
      .catch(function(err) {
         log.error("updateRecipient failed. reason: %s", err.message);
         next(new restify.InternalServerError());
      });
};


var deleteRecipient = function(log, req, res, next) {
   var appId = req.context.appId,
       recipientId = req.context.recipientId;

   dao.Recipient.del(appId, recipientId)
      .then(function() {
         next();
      })
      .catch(function(err) {
         log.error("deleteRecipient failed. reason: %s", err.message);
         next(); // The API will pretty much assert delete worked no matter what
      });
};


exports.init = function(server, log, conf) {
   var common = require("./common.js")(log, conf);

   server.post({path: "/applications/:appId/recipients", version: "1.0.0"},
               common.authorize, common.translateExternalAppId, common.loadApplication, _.partial(createRecipient, log), returnRecipient);

   server.get({path: "/applications/:appId/recipients", version: "1.0.0"},
              common.authorize, common.translateExternalAppId, common.loadApplication, _.partial(loadAllRecipients, log), returnAllRecipients);

   server.get({path: "/applications/:appId/recipients/:recipientId", version: "1.0.0"},
              common.authorize, common.translateExternalAppId, common.loadApplication, _.partial(loadRecipient, log), returnRecipient);

   server.put({path: "/applications/:appId/recipients/:recipientId", version: "1.0.0"},
              common.authorize, common.translateExternalAppId, common.loadApplication, _.partial(loadRecipient, log), _.partial(updateRecipient, log), returnRecipient);

   server.del({path: "/applications/:appId/recipients/:recipientId", version: "1.0.0"},
              common.authorize, common.translateExternalAppId, common.loadApplication, _.partial(deleteRecipient, log), common.emptyOKChainHandler);
};
