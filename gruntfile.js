/*
 * Bullhorn: Get your message heard
 *
 * Copyright (C) 2014
 * Licensed under the GNU Lesser General Public License v3
 */
var initTestData = function(grunt) {
   var rsvp = require("rsvp"),
       _ = require("lodash"),
       uuid = require("node-uuid"),
       dao = require("./lib/dao"),
       conf = require("./lib/conf.js"),
       security = require("./lib/security");

   return function() {
      var done = this.async(),
          domainId,
          accessKeyId = uuid.v1(),
          profile1Id = uuid.v1(),
          profile2Id = uuid.v1();
          
      grunt.log.writeln("initializing firebase with sample set of test data");
      dao.Domain.create({
         name: "Sample Application",
         env: "Production",
         accessKeys: [accessKeyId],
         numRecipients: 1,
         numMessages: 0,
         profiles: [profile1Id, profile2Id],
         channels: [
            {
               id: "newsletter",
               name: "Newsletter",
               desc: "Our weekly list of tips and tricks for using the app.",
               urgent: false
            },
            {
               id: "password-reset",
               name: "Password Reset",
               desc: "Notifications sent every time you reset your password.",
               urgent: true
            }
         ]
      }).then(function(app) {
         domainId = app.id;
         return dao.AccessKey.create({
            id: accessKeyId,
            domain: domainId
         });
      }).then(function() {
         return rsvp.all([
            dao.Profile.update({
               id: profile1Id,
               domain: domainId,
               firstName: "Alice",
               lastName: "Doe",
               subscriptions: [
                  {
                     id: "newsletter",
                     email: "adoe@gmail.com"
                  },
                  {
                     id: "password-reset",
                     sms: "12065551212",
                     email: "adoe@gmail.com"
                  }
               ]
            }),
            dao.Profile.update({
               id: profile2Id,
               domain: domainId,
               firstName: "Bob",
               lastName: "Doe",
               subscriptions: [
                  {
                     id: "password-reset",
                     sms: "19175551212"
                  }
               ]
            })
         ]);
      }).then(function(profiles) {
         var secretKey = security.generateKey(conf.get("crypto.salts.apikey"), accessKeyId);

         grunt.log.writeln("\n\nDomain GUID => " + domainId);
         grunt.log.writeln("Alice Doe GUID => " + profiles[0].id);
         grunt.log.writeln("Bob Doe GUID => " + profiles[1].id);
         grunt.log.writeln("API Info:");
         grunt.log.writeln("   ID => " + accessKeyId);
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


  var source = ["*.js", "lib/**/*.js", "spec/**/*.js", "package.json", "conf/*.json"],
      pkgJSON = grunt.file.readJSON("package.json"),
      buildVer = pkgJSON.version + (grunt.option("buildNumber") ? "-" + grunt.option("buildNumber") : "");
  
  grunt.initConfig({
    pkg: pkgJSON,
    ver: buildVer,
    jshint: {
      src: source
    },
    jasmine_node: {
      all: ["spec/"]
    },
    clean: {
      testOutput: ["_SpecRunner.html", "*.log"],
      generatedDocs: ["docs/bullhorn"],
      package: ["dist", "*.tar.gz"]
    },
    copy: {
      app: {
        files: [
          {expand: true, src: ["package.json", "app.js"], dest: "dist/"},
          {expand: true, src: ["lib/**", "conf/**"], dest: "dist/"}
        ],
        options: {
           process: function(content, srcpath) {
              if(srcpath === "package.json") {
                 var distPkg = JSON.parse(content);
                 distPkg.version = buildVer;
                 return JSON.stringify(distPkg, null, "\t");
              }
              else {
                 return content;
              }
           }
        }
      }
    },
    exec: {
      dist_npm_install: {
        cwd: "dist/",
        cmd: "npm install --production --no-optional"
      }
    },
    compress: {
      app: {
        options: {
          mode: "tgz",
          pretty: true,
          archive: "<%= pkg.name %>_<%= ver %>.tar.gz"
        },
        files: [
          {expand: true, cwd: "dist/", src: ["**/*"], dest: "bullhorn"}
        ]
      }
    }
  });

  grunt.registerTask("initdb", initTestData(grunt));
  grunt.registerTask("test", ["jshint", "jasmine_node", "clean:testOutput"]);
  grunt.registerTask("package", ["copy:app", "exec:dist_npm_install", "compress:app"]);
  grunt.registerTask("release", ["clean", "test", "package"]);

  // alias default to test since that's most likely what we want to do.
  grunt.registerTask("default", ["test"]);
};
