/**
 * Application logging facade.
 *
 * The existing node.js logging libraries seemed too complicated for
 * now and most don't support transports to a centralized logging
 * server, like logstash. This is currently a thin facade on the
 * console.log and associated functions.
 *
 * @module logger
 */
var _ = require("lodash");


/**
 * Append spaces to an input string to make it a particular
 * length. If the string is longer than the defined length,
 * just return the string.
 */
var padStr = function(str, length) {
  while(str.length < length) {
    str += " ";
  }
  return str;
};


/**
 * Returns the right function from the node.js console object that
 * corresponds to the log level we're interested in. If the level
 * is misspelled or not in the list, we default to console.error.
 */
var outputFn = function(level) {
  switch(level) {
    case "TRACE":
      return console.log;

    case "INFO":
      return console.info;

    case "WARN":
      return console.warn;

    default:
      return console.error;
  }
};


/**
 * Given a desired logging level, the current module and a message,
 * this function generates the formatted string we want, adds in the
 * timestamp and then calls the output function to get the message
 * to the destination.
 */
var logMsg = function(level, currentModule, msg /*, msg formatting args */) {
  var varargs = _.toArray(arguments).slice(3),
      fn = outputFn(level),
      logTime = (new Date()).toUTCString(),
      args = ["%s [%s] %s - " + msg, logTime, padStr(level, 5), currentModule].concat(varargs);

  fn.apply(console, args);
};


/**
 * The public interface. Return a new object based on the current module
 * that has functions for trace, info, warn and error.
 */
module.exports = _.memoize(function(currentModule) {
  return {
    trace: _.partial(logMsg, "TRACE", currentModule),
    debug: this.trace,
    info: _.partial(logMsg, "INFO", currentModule),
    warn: _.partial(logMsg, "WARN", currentModule),
    error: _.partial(logMsg, "ERROR", currentModule)
  };
});
