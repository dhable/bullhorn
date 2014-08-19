/**
 * The Jetway answer to dependency injection with node.js. While the module
 * structure is far better than Java, we would also like to be able to get
 * rid of functionality for writing unit tests easier. The pattern for this
 * seems to be to move towards an injected module pattern instead of having
 * modules reference each other with file paths.
 *
 * Right now this isn't "injection" per se. Instead a module can identify
 * itself for management by the dependency module by exporting an identifier
 * nammed "_injectAs" with the value of _injectAs being a string by which
 * this module wants to be known as. This can then be retrieved later on
 * using the fetch() method of the module.
 *
 * The idea is that the application bootstrapper will create a single
 * instance of the dependency object and assign it to the global namesapce.
 * It would be interesting to have a module also export an array called
 * _inject that the dependency module could replace as it loaded the module
 * with previous definitions. That would require some control over the load
 * order when scanning the packages and not a critical feature for now.
 *
 * @module dependency
 */
var fs = require("fs"),
    path = require("path"),
    _ = require("lodash");


/**
 * The instance of the dependency cache object. Exported only
 * for testing. Don't use this object unless you know what you're
 * doing.
 * 
 * @private
 */
var depCache = exports._depCache = {};


/**
 * Internal helper function that knows how to recurse through the directory
 * structure and load up .js files to check them for any dependency information.
 * Not all files need to contain dependency information. It's should only be
 * used to register modules that can be used over a wide range of files in the
 * application (like logging).
 *
 * @private
 */
var populateDepCache = function(baseDir) {
   var currentDir,
       toScan = [baseDir];

   // This helper function needs to be defined inside the populateDepCache
   // function since it references toScan. It's broken out since JSHint didn't
   // like defining the function inside the while loop when it was as inline
   // anonymous callback function to forEach.
   var handleElementFromDirectoryScan = _.curry(function(currentDir, elem) {
      var absElem = path.join(currentDir, elem),
          elemStat = fs.statSync(absElem);

      if(elemStat.isDirectory()) {
         toScan.push(absElem);
      }
      else if(elemStat.isFile() && path.extname(absElem) === ".js") {
         try {
            var module = require(absElem);
            if(module._injectAs) {
               depCache[module._injectAs] = module;
            }
         }
         catch(ex) {
            // We want to skip the error but also do something with it that
            // might get someone to notice it. console.log seems to be the 
            // next best place for it.
            console.log("dependency has a problem with module " + absElem + ": " + ex);
         }
      }
   });


   if(!baseDir) {
      throw new Error("baseDir is a required parameter");
   }

   if(!fs.existsSync(baseDir)) {
      throw new Error("baseDir does not exist");
   }

   while(toScan.length) {
      currentDir = toScan.shift();
      fs.readdirSync(currentDir).forEach(
         handleElementFromDirectoryScan(currentDir));
   }
};


/**
 * Returns a new dependency manager that contains all of the modules from baseDir
 * down registered under their injection name, if they have one.
 *
 * @memberOf dependency
 */
exports.load = function(fromDir) {
   populateDepCache(fromDir);

   return {
      fetch: function(depName) {
         if(!depName) {
            throw new Error("dependency name is required");
         }

         if(!_.has(depCache, depName)) {
            throw new Error("dependency " + depName + " was not registered");
         }

         return depCache[depName];
      }
   };
};
