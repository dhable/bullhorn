/**
 * Loads the application configuration from a number of possible
 * configuration sources and then validates against the known
 * schema.
 *
 * @module conf
 */
var convict = require("convict");


var schema = {
   port: {
    doc: "Port to bind the ReST API to.",
    format: "port",
    default: 3000,
    env: "PORT"
  },
  stats: {
    periodLength: {
      docs: "The number of seconds to aggerate drain statistics into single numbers.",
      default: 300,
      env: "PERIODLENGTH"
    },
    retentionLength: {
      docs: "The number of aggerate drain statistics to keep in memory.",
      default: 3600,
      env: "RETENTIONLENGTH"
    }
  },
  sms: {
    shortCode: {
      doc: "The SMS short code that bullhorn is sending messages from.",
      default: "+16202704254",
      env: "SHORT_CODE"
    }
  },
  email: {
    from: {
      doc: "The email address that bullhorn is sending emails from.",
      default: "notification@jetway.io",
      env: "EMAIL"
    }
  },
  twilio: {
    accountSid: {
      doc: "The Twilio API SID for the account.",
      default: "AC259b6c3ba019fe68d38eda2f66acab62 ",
      env: "SID"
    },
    authToken: {
      doc: "The Twilio API auth token. Keep this a secret.",
      default: "9549fcb1885ed8e6ac0d448dc0f30a1a",
      env: "AUTHTOKEN"
    }
  },
  sendgrid: {
    user: {
      doc: "The SendGrid API user account configured with SendGrid,",
      default: "dhable",
      env: "SENDGRID_USER"
    },
    key: {
      doc: "The SendGrid API key configured with SendGrid.",
      default: "p8OQux5lK3t4W2ttRsgiDMtxMA",
      env: "SENDGRID_KEY"
    }
  }

};


/**
 * Returns the currently loaded configuration. This method can load the
 * configuration if one previously hasn't been loaded.
 */
module.exports = function() {
  // If the configuration was previously loaded, use that configuration
  // instead of reloading.
  if(global.bullhorn && global.bullhorn.conf) {
    return global.bullhorn.conf;
  }

  // Otherwise, reload the configuration per our schema.
  global.bullhorn = global.bullhorn || {};
  global.bullhorn.conf = convict(schema);
  global.bullhorn.conf.validate();
  return global.bullhorn.conf;
};
