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
         // TODO: Add application data to request
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


exports.genApiKey = function(req, res, next) {
   var env = conf.get("env"),
       apiSalt = conf.get("crypto.salts.apikey"),
       hash = crypto.createHmac("sha512", apiSalt),
       apiKey = "";

   if(env !== "dev" && apiSalt === "DEVONLY") {
      log.error("Development API key salt can onyl be used in dev environment.");
      process.exit(666);
   }

   hash.update("appId")
   apiKey = hash.digest("base64"); 
};


exports.updateEntity = function(req, res, next) {
};


exports.returnKey = function(req, res, next) {
};

