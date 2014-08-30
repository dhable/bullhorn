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
 * @param accessKeyId The API access key guid.
 * @return A base64 string of the API key hash.
 */
var generateKey = exports.generateKey = function(salt, accessKeyId) {
   if(!salt || !accessKeyId) {
      throw new Error("salt and accessKeyId are required parameters");
   }

   var start = Date.now(),
       hash = crypto.createHmac("sha512", salt);

   try {
      hash.update(accessKeyId);
      return hash.digest("base64");
   } 
   finally {
      log.info("generateKey took %s ms to execute.", Date.now() - start);
   }
};


/**
 * Verify that an API key is valid for a given the accessKeyId.
 *
 * @memberOf security
 * @param salt The salt value used in key generation
 * @param accessKeyId The API access key guid.
 * @param apiKey The API key to check if tied to the salt and appId.
 * @return If the API key is certian valid for this application, otherwise false.
 */
var isKeyValid = exports.isKeyValid = function(salt, accessKeyId, apiKey) {
   try {
      return generateKey(salt, accessKeyId) === apiKey;
   }
   catch(err) {
      log.warn(err);
      return false;
   }
};


/**
 * Breaks the auth header into it's various pieces.
 */
var parseAuthenticationHeader = exports.parseAuthenticationHeader = function(authHeaderValue) {
  var delimEq = authHeaderValue.indexOf("="),
      accessKeyId = authHeaderValue.substring(0, delimEq),
      apiSecret = authHeaderValue.substring(delimEq + 1);

  return {
    accessKeyId: accessKeyId,
    apiSecret: apiSecret
  };
};


/**
 * Pulls apart the value of the X-Jetway-Key Authentication header and determines if
 * the API key values are valid for authentication.
 *
 * @memberOf security
 * @param salt The salt value used in key generation
 * @param authHeaderValue The raw value (in the form of [accessKeyId]=[secretKey])
 * return true if the header value can be verified as valid, otherwise false
 */
exports.isAuthenticationHeaderValid = function(salt, authHeaderValue) {
   try {
      var parts = parseAuthenticationHeader(authHeaderValue);
      return isKeyValid(salt, parts.accessKeyId, parts.apiSecret);
   }
   catch(err) {
      log.warn(err);
      return false;
   }
};
