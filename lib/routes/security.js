/** 
 *
 * @module routes.security
 */
var crypto = require("crypto"),
    conf = require("../conf.js");


var log = require("../logger.js")("routes.security");


/**
 *
 * @memberOf routes.security
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
 *
 * @memberOf routes.security
 */
var isKeyValid = exports.isKeyValid = function(apiKey, appId) {
   try {
      return generateKey(appId) === apiKey;
   } catch(e) {
      return false;
   }
};


exports.authorize = function(req, res, next) {
};


exports.generateKey = function(req, res, next) {
};
