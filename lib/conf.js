/**
 * Loads the application configuration from a number of possible
 * configuration sources and then validates against the known
 * schema.
 *
 * @module conf
 */
var path = require("path"),
    convict = require("convict");


var schema = {
   confset: {
      doc: "This is the configuration set name to use. This is the base part of the filename.",
      default: "devlocal",
      arg: "conf-file"
   },
   env: {
      doc: "Which environment we're in",
      default: "dev"
   },
   port: {
      doc: "Port to bind the ReST API to.",
      format: "port",
      default: 3000,
      env: "PORT",
      arg: "port"
   },
   db: {
      firebase: {
         url: {
            doc: "",
            default: "jetway-test.firebaseIO.com"
         }
      }
   },
   statsd: {
      host: {
         doc: "Host name of the statsd server",
         default: "localhost"
      },
      port: {
         doc: "Port of the statsd server.",
         default: 8125
      },
      namespace: {
         doc: "Common stat name namespace for bullhorn",
         default: "bullhorn"
      },
      disable: {
         doc: "Determine if the stats emitting functionality is active",
         default: false
      }
   },
   crypto: {
      salts: {
         apikey: {
            doc: "",
            default: "DEVONLY"
         }
      }
   },
  email: {
    from: {
      doc: "The email address that bullhorn is sending emails from.",
      default: ""
    }
  },
  twilio: {
    accountSid: {
      doc: "The Twilio API SID for the account.",
      default: " "
    },
    authToken: {
      doc: "The Twilio API auth token. Keep this a secret.",
      default: ""
    }
  },
  sendgrid: {
    user: {
      doc: "The SendGrid API user account configured with SendGrid,",
      default: ""
    },
    key: {
      doc: "The SendGrid API key configured with SendGrid.",
      default: ""
    }
  }
};

global.bullhorn = global.bullhorn || {};
global.bullhorn.conf = convict(schema);

var confset = global.bullhorn.conf.get("confset"),
    conffiles = [path.join(__dirname, "..", "conf", confset + ".global.json"),
                 path.join(__dirname, "..", "conf", confset + ".private.json"),
                 path.join(__dirname, "..", "conf", confset + ".local.json")];

global.bullhorn.conf.loadFile(conffiles);
global.bullhorn.conf.validate();


/**
 * Returns the currently loaded configuration. This method can load the
 * configuration if one previously hasn't been loaded.
 */
module.exports = global.bullhorn.conf;
