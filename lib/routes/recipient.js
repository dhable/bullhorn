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


exports.returnRecipient = function(req, res, next) {
   var recipient = req.local.recipient;

   res.json(recipient);
   next(false);
};


exports.updateRecipient = function(req, res, next) {
   var app = req.local.app,
       recipient = req.local.recipient;

   dao.Recipient.update(app.id, recipient)
      .then(function() {
         next();
      })
      .catch(function(err) {
         log.error("updateRecipient failed. reason: %s", err.message);
         next(new restify.InternalServerError());
      });
};


exports.deleteRecipient = function(req, res, next) {
   var app = req.local.app,
       recipient = req.local.recipient;

   dao.Recipient.del(app.id, recipient.id)
      .then(function() {
         next();
      })
      .catch(function(err) {
         log.error("deleteRecipient failed. reason: %s", err.message);
         next(new restify.InternalServerError());
      });
};


