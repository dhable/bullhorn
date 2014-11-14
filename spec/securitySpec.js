/*
 * Bullhorn: Get your message heard
 *
 * Copyright (C) 2014
 * Licensed under the GNU Lesser General Public License v3
 */
var security = require("../lib/security");


describe("The security module", function() {
   var salt = "DEVONLY";

   describe("generateKey() function", function() {
      it("should return a base64 hash given a string accessKeyId", function() {
          var actualHash = security.generateKey(salt, "af38c556-7653-4c41-8f1e-81ee859a817c");
          expect(actualHash).toBeDefined();
          expect(function() { new Buffer(actualHash, "base64"); }).not.toThrow();
      });

      it("should raise an exception if accessKeyId is null or undefined", function() {
         expect(function() { security.generateKey(salt, null); }).toThrow();
         expect(function() { security.generateKey(salt, undefined); }).toThrow(); 
      });

   }); // end of generateKey() function


   describe("isKeyValid() function", function() {
      var testAccessKeyId = "af38c556-7653-4c41-8f1e-81ee859a817c",
          testApiKey = security.generateKey(salt, testAccessKeyId);

      it("should return false if the apiKey is null", function() { 
         var isValid = security.isKeyValid(salt, testAccessKeyId, null);
         expect(isValid).toBe(false);
      });

      it("should return false if the apiKey is undefined", function() {
         var isValid = security.isKeyValid(salt, testAccessKeyId, undefined);
         expect(isValid).toBe(false);
      });

      it("should return true if the apiKey matches", function() {
         var isValid = security.isKeyValid(salt, testAccessKeyId, testApiKey);
         expect(isValid).toBe(true);
      });

      it("should return false if the apiKey does not match", function() {
         var isValid = security.isKeyValid(salt, "af38c556-1111-4c41-8f1e-81ee859a817c", testApiKey);
         expect(isValid).toBe(false);
      });

      it("should return false is the accessKeyId is null", function() {
         var isValid = security.isKeyValid(salt, null, testApiKey);
         expect(isValid).toBe(false);
      });

      it("should return false is the accessKeyId is undefined", function() {
         var isValid = security.isKeyValid(salt, undefined, testApiKey);
         expect(isValid).toBe(false);
      });
   }); // end of isKeyValid() function


   describe("isAuthenticationHeaderValid() function", function() {
      var testAuthHeaderValue = "94f995a0-1ff9-11e4-8734-57e30f75f87a=x4Lwm6vETwKuc7D9m3Kfcn47nb7UM4AXw39dvJyZmCcwSrt4a/yruDZ2I7WPvENq1xu8A4pUXAR3ke6G2iZKrA==",
          testBadAuthHeaderValue1 = "94f995a0-1ff9-11e4-8734-57e30f75f87a x4Lwm6vETwKuc7D9m3Kfcn47nb7UM4AXw39dvJyZmCcwSrt4a/yruDZ2I7WPvENq1xu8A4pUXAR3ke6G2iZKrA==";

      it("should return true when header is valid", function() {
         var isValid = security.isAuthenticationHeaderValid(salt, testAuthHeaderValue);
         expect(isValid).toBe(true);
      });

      it("should return false when header is undefined", function() {
         var isValid = security.isAuthenticationHeaderValid(salt, undefined);
         expect(isValid).toBe(false);
      });

      it("should return false when header is null", function() {
         var isValid = security.isAuthenticationHeaderValid(salt, null);
         expect(isValid).toBe(false);
      });

      it("should return false when header doesn't contain = between accessKeyId and secret", function() {
         var isValid = security.isAuthenticationHeaderValid(salt, testBadAuthHeaderValue1);
         expect(isValid).toBe(false);
      });

      it("should return false when the salt is undefined", function() {
         var isValid = security.isAuthenticationHeaderValid(undefined, testAuthHeaderValue);
         expect(isValid).toBe(false);
      });

      it("should return false when the salt is null", function() {
         var isValid = security.isAuthenticationHeaderValid(null, testAuthHeaderValue);
         expect(isValid).toBe(false);
      });

      it("should return false when the salt does not match the key", function() {
         var isValid = security.isAuthenticationHeaderValid("someOtherSalt", testAuthHeaderValue);
         expect(isValid).toBe(false);
      });

   }); // end of isAuthenticationHeaderValid() function

});
