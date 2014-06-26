
var initTestData = function(grunt) {
   var rsvp = require("rsvp"),
       _ = require("lodash"),
       uuid = require("node-uuid"),
       dao = require("./lib/dao"),
       security = require("./lib/routes/security.js");

   return function() {
      var done = this.async(),
          internalId,
          externalId = uuid.v1();
          
      grunt.log.writeln("initializing firebase with sample set of test data");
      dao.Application.create({
         name: "Sample Application",
         env: "Production",
         externalId: externalId,
         numRecipients: 1,
         numMessages: 0,
         channels: [
            {
               id: 1,
               name: "Newsletter",
               desc: "Our weekly list of tips and tricks for using the app.",
               urgent: false
            },
            {
               id: 2,
               name: "Password Reset",
               desc: "Notifications sent every time you reset your password.",
               urgent: true
            }
         ]
      }).then(function(app) {
         internalId = app.id;
         return dao.ExternalApp.create({
            id: externalId,
            appId: internalId
         });
      }).then(function() {
         return rsvp.all([
            dao.Recipient.create(internalId, {
               firstName: "Alice",
               lastName: "Doe",
               timeZone: -8,
               drains: [
                  {
                     type: "email",
                     verified: true,
                     "for": [1],
                     addr: "adoe@gmail.com",
                     useSmartDND: true
                  },
                  {
                     type: "sms",
                     verified: false,
                     "for": [1, 2],
                     addr: "12065551212",
                     useSmartDND: false
                  }
               ]
            }),
            dao.Recipient.create(internalId, {
               firstName: "Bob",
               lastName: "Doe",
               timeZone: -6,
               drains: [
                  {
                     type: "sms",
                     verified: true,
                     "for": [1, 2],
                     addr: "19175551212",
                     useSmartDND: true
                  }
               ]
            })
         ]);
      }).then(function(recipients) {
         var secretKey = security.generateKey(externalId);

         grunt.log.writeln("\n\nApplication GUID => " + internalId);
         grunt.log.writeln("Alice Doe GUID => " + recipients[0].id);
         grunt.log.writeln("Bob Doe GUID => " + recipients[1].id);
         grunt.log.writeln("API Info:");
         grunt.log.writeln("   ID => " + externalId );
         grunt.log.writeln("   Secret => " + secretKey);

         done();
      }).catch(function(err) {
         console.log(err);
         grunt.log.writeln("error");
         done(false);
      });
   };
};


module.exports = function(grunt) {
  "use strict";
  require("load-grunt-tasks")(grunt);
  require("time-grunt")(grunt);


  var source = ["*.js", "lib/**/*.js", "spec/**/*.js", "package.json", "conf/*.json"];
  
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      src: source
    },
    jasmine_node: {
      all: ["spec/"]
    },
    clean: {
      testOutput: ["_SpecRunner.html", "*.log"],
      generatedDocs: ["docs/bullhorn"]
    }
  });

  grunt.registerTask("initdb", initTestData(grunt));
  grunt.registerTask("test", ["jshint", "jasmine_node", "clean:testOutput"]);
  grunt.registerTask("release", ["test", "validate-package"]);

  // alias default to test since that's most likely what we want to do.
  grunt.registerTask("default", ["test"]);
};
