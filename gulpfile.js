var _ = require("lodash"),
    gulp = require("gulp"),
    jshint = require("gulp-jshint"),
    stylish = require("jshint-stylish"),
    jasmine = require("gulp-jasmine");


var paths = {
  source: ["lib/**/*.js"],
  specs: ["spec/**/*.js"]
};


/*
 * Task to check our source code using the JSHint module and
 * our set of Jasmine specifications.
 */
gulp.task("test", function() {
  var targetFiles = _.union(paths.source, paths.specs);
  return gulp.src(targetFiles)
             .pipe(jshint())
             .pipe(jshint.reporter(stylish))
             .pipe(jasmine({verbose: true}));
});


/*
 * By default, watch the source and spec files and execute the
 * test task when they change.
 */
gulp.task("default", ["test"], function() {
  gulp.watch(paths.source, ["test"]);
});
