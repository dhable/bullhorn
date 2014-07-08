/**
 *
 * @module security
 */
var crypto = require("crypto");


var log = require("../logger.js")("security");


/**
 * Function that can generate a valid API key given an applicationId value.
 * This is done by using a SHA-512 HMAC hash algorithm (fairly secure) with
 * configured salt value to generate a hash. Do not use anything other than
 * HMAC and pick the largest key. This will ensure some level of security.
 *
 * @memberOf security
 * @param salt The salt value to use with key generation.
 * @param appId The Application entity ID value.
 * @return A base64 string of the API key hash.
 */
var generateKey = exports.generateKey = function(salt, appId) {
   if(!salt || !appId) {
      throw new Error("salt and appId are required parameters");
   }

   var start = Date.now(),
       hash = crypto.createHmac("sha512", salt);

   try {
      hash.update(appId);
      return hash.digest("base64");
   } 
   finally {
      log.info("generateKey took %s ms to execute.", Date.now() - start);
   }
};


/**
 * Verify that an API key is valid for a given Application entity.
 *
 * @memberOf security
 * @param salt The salt value used in key generation
 * @param appId The application id used in key generation
 * @param apiKey The API key to check if tied to the salt and appId.
 * @return If the API key is certian valid for this application, otherwise false.
 */
exports.isKeyValid = function(salt, appId, apiKey) {
   try {
      return generateKey(salt, appId) === apiKey;
   }
   catch(err) {
      console.log(err);
      return false;
   }
};
