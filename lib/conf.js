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
     default: 3033,
    env: "PORT"
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
