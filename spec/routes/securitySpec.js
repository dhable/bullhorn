var security = require("../../lib/routes/security.js");


describe("The route security module", function() {


   describe("generateKey() function", function() {
      it("should return a base64 hash given a string appId", function() {
          var actualHash = security.generateKey("af38c556-7653-4c41-8f1e-81ee859a817c");
          expect(actualHash).toBeDefined();
          expect(function() { new Buffer(actualHash, "base64"); }).not.toThrow();
      });

      it("should raise an exception if appId is null or undefined", function() {
         expect(function() { security.generateKey(null); }).toThrow();
         expect(function() { security.generateKey(undefined); }).toThrow(); 
      });

      it("should raise an exception if salt is dev value in non-dev environment.", function() {
         global.bullhorn.conf.set("env", "prod");
         try {
            expect(function() {
               security.generateKey("af38c556-7653-4c41-8f1e-81ee859a817c");
            }).toThrow();
         } finally {
            // In a finally block to ensure that we reset the env after the test
            global.bullhorn.conf.set("env", "dev");
         }
      });
   });



   describe("isKeyValid() function", function() {
      var testAppId = "af38c556-7653-4c41-8f1e-81ee859a817c",
          testApiKey = security.generateKey(testAppId);

      it("should return false if the apiKey is null", function() { 
         var isValid = security.isKeyValid(null, testAppId);
         expect(isValid).toBe(false);
      });

      it("should return false if the apiKey is undefined", function() {
         var isValid = security.isKeyValid(undefined, testAppId);
         expect(isValid).toBe(false);
      });

      it("should return true if the apiKey matches", function() {
         var isValid = security.isKeyValid(testApiKey, testAppId);
         expect(isValid).toBe(true);
      });

      it("should return false if the apiKey does not match", function() {
         var isValid = security.isKeyValid(testApiKey, "af38c556-1111-4c41-8f1e-81ee859a817c");
         expect(isValid).toBe(false);
      });

      it("should return false is the appId is null", function() {
         var isValid = security.isKeyValid(testApiKey, null);
         expect(isValid).toBe(false);
      });

      it("should return false is the appId is undefined", function() {
         var isValid = security.isKeyValid(testApiKey, undefined);
         expect(isValid).toBe(false);
      });

      it("should return false if the salt is the dev value in a non-dev environment", function() {
         global.bullhorn.conf.set("env", "prod");
         try {
            var isValid = security.isKeyValid(testApiKey, testAppId);
            expect(isValid).toBe(false);
         } finally {
            // In a finally block to ensure that we reset the env after the test
            global.bullhorn.conf.set("env", "dev");
         }
      });
   });


});
