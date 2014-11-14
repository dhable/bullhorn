/*
 * Bullhorn: Get your message heard
 *
 * Copyright (C) 2014
 * Licensed under the GNU Lesser General Public License v3
 */
 var _ = require("lodash"),
     common = require("../../lib/dao/common.js");


 describe("The DAO common module", function() {

   describe("dbSeralizeArray utility function", function() {
      it("Should raise exception if input is undefined", function() {
          expect(common.dbSerializeArray).toThrow("Input parameter was not an array");
      });

      it("Should raise exception if input is null", function() {
         var testFn = _.partial(common.dbSerializeArray, null);
         expect(testFn).toThrow("Input parameter was not an array");
      });

      it("Should raise exception if input is an object", function() {
         var testFn = _.partial(common.dbSerializeArray, {});
         expect(testFn).toThrow("Input parameter was not an array");
      });

      it("Should raise exception if input is a string", function() {
         var testFn = _.partial(common.dbSerializeArray, "string");
         expect(testFn).toThrow("Input parameter was not an array");
      });

      it("Should raise exception if input is a number", function() {
         var testFn = _.partial(common.dbSerializeArray, 42);
         expect(testFn).toThrow("Input parameter was not an array");
      });

      it("Should raise exception if input is a function", function() {
         var testFn = _.partial(common.dbSerializeArray, function() { });
         expect(testFn).toThrow("Input parameter was not an array");
      });

      it("Should return empty object given an empty array", function() {
         var actual = common.dbSerializeArray([]);
         expect(actual).toEqual({});
      });

      it("Should return object with values as keys if array contains simple values", function() {
         var actual = common.dbSerializeArray(["value1", "value2"]);
         expect(actual).toEqual({value1: true, value2: true});
      });

      it("Should return object with id as key and remaining object as value", function() {
         var actual = common.dbSerializeArray([
            {
               id: "newsletter",
               desc: "Our weekly list of tips and tricks for using the app.",
               urgent: false
            },
            {
               id: "pwreset",
               desc: "Notifications sent every time you reset your password.",
               urgent: true
            }
         ]);

         expect(actual).toEqual({
            newsletter: { 
               desc: "Our weekly list of tips and tricks for using the app.",
               urgent: false
            },
            pwreset: {
               desc: "Notifications sent every time you reset your password.",
               urgent: true
            }
         });
      });

      it("Should use array index if objects don't have id", function() {
         var actual = common.dbSerializeArray([
            {
               name: "newsletter",
               desc: "Our weekly list of tips and tricks for using the app.",
               urgent: false
            }
         ]);

         expect(actual).toEqual({
            "0": {
               name: "newsletter",
               desc: "Our weekly list of tips and tricks for using the app.",
               urgent: false
            }
         });
      });

      it("Should handle arrays with all previous cases mixed in", function() {
         var actual = common.dbSerializeArray([
            "stringPropertyA",
            {id: "pwreset", urgent: true},
            {name: "newsletter", urgent: false}
         ]);

         expect(actual).toEqual({
            stringPropertyA: true,
            pwreset: {urgent: true},
            "2": {name: "newsletter", urgent: false}
         });
      });
   }); // end of dbSeralizeArray utility function


   describe("dbDeserializeArray utility function", function() {
      it("Should raise exception if input is undefined", function() {
          expect(common.dbDeserializeArray).toThrow("Input parameter was not an object");
      });

      it("Should raise exception if input is null", function() {
         var testFn = _.partial(common.dbDeserializeArray, null);
         expect(testFn).toThrow("Input parameter was not an object");
      });

      it("Should raise exception if input is an array", function() {
         var testFn = _.partial(common.dbDeserializeArray, []);
         expect(testFn).toThrow("Input parameter was not an object");
      });

      it("Should raise exception if input is a string", function() {
         var testFn = _.partial(common.dbDeserializeArray, "string");
         expect(testFn).toThrow("Input parameter was not an object");
      });

      it("Should raise exception if input is a number", function() {
         var testFn = _.partial(common.dbDeserializeArray, 42);
         expect(testFn).toThrow("Input parameter was not an object");
      });

      it("Should raise exception if input is a function", function() {
         var testFn = _.partial(common.dbDeserializeArray, function() { });
         expect(testFn).toThrow("Input parameter was not an object");
      });

      it("Should return empty array given an empty object", function() {
         var actual = common.dbDeserializeArray({});
         expect(actual).toEqual([]);
      });

      it("Should return array with objects from object with values as keys", function() {
         var actual = common.dbDeserializeArray({value1: true, value2:true});
         expect(actual).toEqual(["value1", "value2"]);
      });

      it("Should return array with objects contain value and id fields", function() {
         var actual = common.dbDeserializeArray({
            newsletter: {
               desc: "Our weekly list of tips and tricks for using the app.",
               urgent: false
            },
            pwreset: {
               desc: "Notifications sent every time you reset your password.",
               urgent: true
            }
         });

         expect(actual).toEqual([
            { 
               id: "newsletter",
               desc: "Our weekly list of tips and tricks for using the app.",
               urgent: false
            },
            {
               id: "pwreset",
               desc: "Notifications sent every time you reset your password.",
               urgent: true
            }
         ]);
      });

      it("Should ignore keys that are index numbers", function() {
         var actual = common.dbDeserializeArray({
            "0": {
               name: "newsletter",
               desc: "Our weekly list of tips and tricks for using the app.",
               urgent: false
            }
         });

         expect(actual).toEqual([
            {
               name: "newsletter",
               desc: "Our weekly list of tips and tricks for using the app.",
               urgent: false
            }
         ]);
      });
 
   }); // end of dbDeserializeArray utility function


   describe("validate helper function ", function() {
      var fields = ["firstName", "lastName"];

      it("Should return an error when object parameter is undefined", function() {
         var actual = common.validate(undefined, ["firstName", "lastName"]);
         expect(actual).toBeTruthy();
         expect(actual.message).toBe("object is null or undefined.");
      });

      it("Should return an error when object parameter is null", function() {
         var actual = common.validate(null, ["firstName", "lastName"]);
         expect(actual).toBeTruthy();
         expect(actual.message).toBe("object is null or undefined.");
      });

      it("Should return an error when object parameter is not an object", function() {
         expect(common.validate(true, ["firstName"]).message).toBe("object is not a plain object.");
         expect(common.validate(1, ["firstName"]).message).toBe("object is not a plain object.");
         expect(common.validate(1.0, ["firstName"]).message).toBe("object is not a plain object.");
         expect(common.validate("obj", ["firstName"]).message).toBe("object is not a plain object.");
         expect(common.validate([], ["firstName"]).message).toBe("object is not a plain object.");
         expect(common.validate(function(){}, ["firstName"]).message).toBe("object is not a plain object.");
      });

      it("Should return an error when object contains fields not in the list", function() {
         var actual = common.validate({firstName: "Dan", lastName: "Hable", foo: 1},
                                      ["firstName", "lastName"]);
         expect(actual.message).toBe("object contains additional fields. [foo]");
      });

      it("Should return an error when object is missing field in the list", function() {
         var actual = common.validate({firstName: "Dan"}, ["firstName", "lastName"]);
         expect(actual.message).toBe("object missing required fields. [lastName]");
      });

      it("Should return falsy value if object contains all fields in the list", function() {
         var actual = common.validate({firstName: "Dan", lastName: "Hable"},
                                      ["firstName", "lastName"]);
         expect(actual).toBeFalsy();
      });

      it("Should return falsy when object and field list are empty", function() {
         expect(common.validate({}, [])).toBeFalsy();
      });

   }); // end of validate utility function

});
