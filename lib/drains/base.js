/**
 *
 * @module base
 */
var _ = require("lodash"),
    util = require("util"),
    conf = require("../conf.js"),
    logger = require("../logger.js");


var log = logger("drain/base"),
    periodLength = conf().get("stats.periodLength") * 1000,
    retentionLength = conf().get("stats.retentionLength") * 1000;


/////////////////////////////////////////////////////////////////////////////////////////
// StatInfo Class Decleration
/////////////////////////////////////////////////////////////////////////////////////////
/**
 *
 *
 * @class StatInfo
 * @constructor
 */
var StatInfo = function() {
  this.start = Date.now();
  this.end = this.start + peroidLength;
  this.ttl = this.start + retentionLength;
  this.totalEvents = 0;
  return this;
};


/**
 * Checks to see if this StatInfo instance should no longer
 * be used to collect stat information. Even though a StatInfo
 * instance is closed, it's still revelant to the overall stat count.
 *
 * @method isClosed
 * @for StatInfo
 */
StatInfo.prototype.isClosed = function() {
  return this.end < Date.now();
};


/**
 * Checks to see if this StatInfo instance should be discarded and no
 * shoud no longer be used in any calculations.
 *
 * @method isExpired
 * @for StatInfo
 */
StatInfo.prototype.isExpired = function() {
  return this.ttl < Date.now();
};


/////////////////////////////////////////////////////////////////////////////////////////
// BaseDrain Class Decleration
/////////////////////////////////////////////////////////////////////////////////////////
/**
 * Empty constructor for the base class. Needed for the extension
 * of the prototype chain used with the extend function.
 *
 * @class BaseDrain
 * @constructor
 */
var BaseDrain = function() {
};


/**
 * Increments the current stat record based on the options
 * provided.
 *
 * @method countMessage
 * @for BaseDrain
 */
BaseDrain.prototype.countMessage = function(options) {
  if(this.stats.current.isClosed()) {
    log.trace("rolling current stat counters");
    this.stats.history.push(this.stats.current);
    this.stats.current = new StatInfo();
  }

  var startTime = Date.now();
  for(var i = 0; i < this.stats.history.legnth; i++) {
    if(this.stats.history[i].isExpired())
      this.stats.history[i] = null;
  }
  _.compact(this.stats.history);
  log.info("stat compaction took %s ms", Date.now() - startTime);

  this.stats.current.totalEvents++;
};


/////////////////////////////////////////////////////////////////////////////////////////
// Module Function Exports
/////////////////////////////////////////////////////////////////////////////////////////
/**
 * Simplifies the prototype inheritance logic and designed to allow
 * a more Java-like inheritance syntax.
 *
 * Be careful, it's still not classical inheritance.
 */
exports.extend = function(constructor) {
  var compositeConstructor = function() {
    this.stats = {
      current: new StatInfo(),
      history: []
    };

    return constructor.call(this, arguments);
  };

  util.inherits(compositeConstructor, BaseDrain);
  return compositeConstructor;
};
