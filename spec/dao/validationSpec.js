var validation = require("../../lib/dao/validation.js");


describe("The DAO validation module", function() {
   var fields = ["firstName", "lastName"];

   it("Should return an error when object parameter is undefined", function() {
      var actual = validation(undefined, ["firstName", "lastName"]);
      expect(actual).toBeTruthy();
      expect(actual.message).toBe("object is null or undefined.");
   });

   it("Should return an error when object parameter is null", function() {
      var actual = validation(null, ["firstName", "lastName"]);
      expect(actual).toBeTruthy();
      expect(actual.message).toBe("object is null or undefined.");
   });

   it("Should return an error when object parameter is not an object", function() {
      expect(validation(true, ["firstName"]).message).toBe("object is not a plain object.");
      expect(validation(1, ["firstName"]).message).toBe("object is not a plain object.");
      expect(validation(1.0, ["firstName"]).message).toBe("object is not a plain object.");
      expect(validation("obj", ["firstName"]).message).toBe("object is not a plain object.");
      expect(validation([], ["firstName"]).message).toBe("object is not a plain object.");
      expect(validation(function(){}, ["firstName"]).message).toBe("object is not a plain object.");
   });

   it("Should return an error when object contains fields not in the list", function() {
      var actual = validation({firstName: "Dan", lastName: "Hable", foo: 1}, 
                              ["firstName", "lastName"]);
      expect(actual.message).toBe("object contains additional fields. [foo]");
   });

   it("Should return an error when object is missing field in the list", function() {
      var actual = validation({firstName: "Dan"}, ["firstName", "lastName"]);
      expect(actual.message).toBe("object missing required fields. [lastName]");
   });

   it("Should return falsy value if object contains all fields in the list", function() {
      var actual = validation({firstName: "Dan", lastName: "Hable"}, 
                              ["firstName", "lastName"]);
      expect(actual).toBeFalsy();
   });

   it("Should return falsy when object and field list are empty", function() {
      expect(validation({}, [])).toBeFalsy();
   });

});
