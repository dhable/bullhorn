module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      src: ["*.js", "lib/**/*.js", "spec/**/*.js",
            "package.json", "conf/*.json"]
    },
    jasmine_node: {
      all: ["spec/"]
    },
    clean: {
      testOutput: ["_SpecRunner.html", "*.log"],
      generatedDocs: ["docs/api"]
    },
    yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        options: {
          paths: 'lib/',
          outdir: 'docs/api'
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-yuidoc");
  grunt.loadNpmTasks("grunt-jasmine-node");
  grunt.loadNpmTasks('grunt-nsp-package');

  grunt.registerTask("setup", ["yuidoc"]);
  grunt.registerTask("test", ["jshint", "jasmine_node", "clean:testOutput"]);
  grunt.registerTask("release", ["test", "validate-package"]);

  // alias default to test since that's most likely what we want to do.
  grunt.registerTask("default", ["test"]);
};
