/*
 * Bullhorn: Get your message heard
 *
 * Copyright (C) 2014
 * Licensed under the GNU Lesser General Public License v3
 */

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
var util = require("util"),
    _ = require("lodash"),
    colors = require("colors");


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
 * Given a desired logging level, the current module and a message,
 * this function generates the formatted string we want, adds in the
 * timestamp and then calls the output function to get the message
 * to the destination.
 */
var logMsg = function(level, currentModule, msg /*, msg formatting args */) {
   var varargs = _.toArray(arguments).slice(3),
       logTime = (new Date()).toUTCString();

   console.log("%s [%s] %s - %s", logTime.grey, padStr(level, 5), currentModule, 
               util.format.apply(this, [msg].concat(varargs)));
};


/**
 * The public interface. Return a new object based on the current module
 * that has functions for trace, info, warn and error.
 */
module.exports = _.memoize(function(currentModule) {
  return {
    trace: _.partial(logMsg, "DEBUG".grey,     currentModule),
    debug: _.partial(logMsg, "DEBUG".grey,     currentModule),
    info:  _.partial(logMsg, "INFO",           currentModule),
    warn:  _.partial(logMsg, "WARN".yellow,    currentModule),
    error: _.partial(logMsg, "ERROR".bold.red, currentModule)
  };
});
