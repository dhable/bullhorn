/** 
 *
 * @module routes.security
 */
var crypto = require("crypto"),
    restify = require("restify"),
    conf = require("../conf.js");


var log = require("../logger.js")("routes.security");


/**
 * Function that can generate a valid API key given an applicationId value.
 * This is done by using a SHA-512 HMAC hash algorithm (fairly secure) with
 * configured salt value to generate a hash. Do not use anything other than
 * HMAC and pick the largest key. This will ensure some level of security.
 *
 * @memberOf routes.security
 * @param appId The Application entity ID value.
 * @return A base64 string of the API key hash.
 */
var generateKey = exports.generateKey = function(appId) {
   var start = Date.now(),
       env = conf.get("env"),
       salt = conf.get("crypto.salts.apikey"),
       hash = crypto.createHmac("sha512", salt);

   if(env !== "dev" && salt === "DEVONLY") {
      log.error("Development API key salt can only be used while running in dev environment.");
      throw new Error("Invalid API key salt for environment");
   }

   try {
      hash.update(appId);
      return hash.digest("base64");
   } finally {
      log.info("generateKey took %s ms to execute.", Date.now() - start);
   }
};


/**
 * Verify that an API key is valid for a given Application entity.
 *
 * @memberOf routes.security
 * @param apiKey The suspect API key to check for validity.
 * @param appId The Application entity ID value.
 * @return true if the API key is certian valid for this application, otherwise false.
 */
var isKeyValid = exports.isKeyValid = function(apiKey, appId) {
   try {
      return generateKey(appId) === apiKey;
   } catch(e) {
      log.debug("API key validation failed. Reason: %s", e.message);
      return false;
   }
};


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
   var appId = req.context.appId,
       apiKey = req.authorization;

   if(apiKey && apiKey.scheme === "X-Jetway-API-Key" && isKeyValid(apiKey.credentials, appId)) {
      return next();
   } else {
      return next(new restify.UnauthorizedError());
   }
};


/**
 * Restify handler to generate a new API key from a given external application ID.
 */
exports.generateAPIKey = function(req, res, next) {
   var err;

   try {
      req.local.newKey = generateKey(req.local.app.externalId);
      if(!req.local.newKey) {
         log.warn("generated key is falsey or an empty string. newKey = %s", req.local.newKey);
         err = new restify.InternalServerError();
      }

      return next();
   } catch(ex) {
      log.warn("generateKey failed. reason: %s", ex.message);
      err = new restify.InternalServerError();
   }

   return next(err);
};
