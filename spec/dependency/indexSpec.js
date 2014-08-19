var path = require("path"),
    _ = require("lodash");

describe("The dependency registry", function() {
   var dependency = require("../../lib/dependency");

   /*
    * Since these unit tests mutate the state of the dependency
    * cache, we need to reset the cache to an empty object after
    * each test. Care needs to be taken to keep the object ref the
    * same since it's used internally with a different variable name.
    */
   afterEach(function() {
      _.keys(dependency._depCache).forEach(function(keyName) {
         delete dependency._depCache[keyName];
      });
   });


   describe("The load() function", function() {
      it("Should raise exception if base directory is undefined", function() {
         var testFn = _.partial(dependency.load);
         expect(testFn).toThrow("baseDir is a required parameter");
      });

      it("Should raise exception if base directory is null", function() {
         var testFn = _.partial(dependency.load);
         expect(testFn).toThrow("baseDir is a required parameter");
      });

      it("Should raise exception if base directory does not exist", function() {
         var testFn = _.partial(dependency.load, path.join(__dirname, "doesNotExist"));
         expect(testFn).toThrow("baseDir does not exist");
      });

      it("Should handle empty base directory and load nothing", function() {
         dependency.load(path.join(__dirname, "emptyTestDir"));
         expect(dependency._depCache).toEqual({});
      });

      it("Should handle directory with only files", function() {
         dependency.load(path.join(__dirname, "filesOnlyDir"));
         expect(dependency._depCache.moduleA).toBeDefined();
         expect(dependency._depCache.moduleB).not.toBeDefined();
      });

      it("Should handle nested directories", function() {
         dependency.load(path.join(__dirname, "nestedDirs"));
         expect(dependency._depCache.moduleA).not.toBeDefined();
         expect(dependency._depCache.moduleB).toBeDefined();
      });
   });


   describe("The fetch() function", function() {
      var dependencyStore;

      beforeEach(function() {
         dependencyStore =  dependency.load(path.join(__dirname, "filesOnlyDir"));
      });

      it("Should raise an exception when dependency name is undefined", function() {
         var testFn = _.partial(dependencyStore.fetch);
         expect(testFn).toThrow("dependency name is required");
      });

      it("Should raise an exception when dependency name is null", function() {
         var testFn = _.partial(dependencyStore.fetch, null);
         expect(testFn).toThrow("dependency name is required");
      });

      it("Should raise an exception when dependency name was not in cache", function() {
         var testFn = _.partial(dependencyStore.fetch, "notInCache");
         expect(testFn).toThrow("dependency notInCache was not registered");
      });

      it("Should return the module object when dependency is registered", function() {
         var actual = dependencyStore.fetch("moduleA");
         expect(actual).toBeDefined();
         expect(actual.myName()).toEqual("moduleA");
      });
   });

});
