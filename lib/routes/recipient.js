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


exports.loadRecipient = function(req, res, next) {
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


exports.loadAllRecipients = function(req, res, next) {
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


exports.returnRecipient = function(req, res, next) {
   var recipient = req.local.recipient;

   res.json(recipient);
   next(false);
};


exports.returnAllRecipients = function(req, res, next) {
   var recipientList = req.local.recipientList;

   res.json(recipientList);
   next(false);
};


exports.updateRecipient = function(req, res, next) {
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


exports.deleteRecipient = function(req, res, next) {
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


