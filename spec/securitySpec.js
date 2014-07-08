var security = require("../lib/security");


describe("The security module", function() {
   var salt = "DEVONLY";

   describe("generateKey() function", function() {
      it("should return a base64 hash given a string appId", function() {
          var actualHash = security.generateKey(salt, "af38c556-7653-4c41-8f1e-81ee859a817c");
          expect(actualHash).toBeDefined();
          expect(function() { new Buffer(actualHash, "base64"); }).not.toThrow();
      });

      it("should raise an exception if appId is null or undefined", function() {
         expect(function() { security.generateKey(salt, null); }).toThrow();
         expect(function() { security.generateKey(salt, undefined); }).toThrow(); 
      });

   });



   describe("isKeyValid() function", function() {
      var testAppId = "af38c556-7653-4c41-8f1e-81ee859a817c",
          testApiKey = security.generateKey(salt, testAppId);

      it("should return false if the apiKey is null", function() { 
         var isValid = security.isKeyValid(salt, testAppId, null);
         expect(isValid).toBe(false);
      });

      it("should return false if the apiKey is undefined", function() {
         var isValid = security.isKeyValid(salt, testAppId, undefined);
         expect(isValid).toBe(false);
      });

      it("should return true if the apiKey matches", function() {
         var isValid = security.isKeyValid(salt, testAppId, testApiKey);
         expect(isValid).toBe(true);
      });

      it("should return false if the apiKey does not match", function() {
         var isValid = security.isKeyValid(salt, "af38c556-1111-4c41-8f1e-81ee859a817c", testApiKey);
         expect(isValid).toBe(false);
      });

      it("should return false is the appId is null", function() {
         var isValid = security.isKeyValid(salt, null, testApiKey);
         expect(isValid).toBe(false);
      });

      it("should return false is the appId is undefined", function() {
         var isValid = security.isKeyValid(salt, undefined, testApiKey);
         expect(isValid).toBe(false);
      });

   });


});
