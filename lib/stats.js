/**
 *
 * @module stats
 */

var _ = require("lodash"),
    conf = require("./conf.js"),
    logger = require("./logger.js");


var log = logger("stats"),
    periodLength = conf().get("stats.periodLength") * 1000,
    retentionLength = conf().get("stats.retentionLength") * 1000;


/////////////////////////////////////////////////////////////////////////////////////////
//
// Internal Helper Functions
//
/////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a new plain object to hold all the stat information
 * as it's collected.
 */
var createTimeSlice = function() {
  var now = Date.now();
  return {
    start: now,
    end: now + periodLength,
    ttl: now + retentionLength,
    buckets: {}
  };
};


/**
 * Given a time slice plain object, determines if this time slice is
 * too old for new data. In these cases, the slice is said to be
 * closed.
 *
 * @param timeSlice A time slice object like those from createTimeSlice.
 * @returns boolean true if the time slice is closed.
 */
var isTimeSliceClosed = function(timeSlice) {
  return timeSlice.end < Date.now();
};


/**
 * Given a time slice plain object, determines if this time slice is
 * too old to retain. In these cases, the slice is said to be expired.
 *
 * @param timeSlice A time slice object like those from createTimeSlice.
 * @return boolean true if the time slice is expired.
 */
var isTimeSliceExpired = function(timeSlice) {
  return timeSlice.ttl < Date.now();
};


/**
 * Given an instance of a Collector, determine if the current time slice
 * is closed. If so, this function will roll the closed time slice into
 * the historic collection and put a new slice in place.
 *
 * @param collector An instance of the Collector object.
 */
var rollSlice = function(collector) {
  if(isTimeSliceClosed(collector.current)) {
    if(_.keys(collector.current.buckets).length > 0) {
      collector.slices.push(collector.current);
    }
    collector.current = createTimeSlice();
  }
};


/**
 * Given an instance of a Collector, loop through the list of historic
 * time slices and eliminate any that are expired. After purging expired
 * time slices, this method will then compact the historic slice array.
 *
 * @param collector An instance of the Collector object.
 */
var compactSlices = function(collector) {
  for(i = 0; i < collector.slices.length; i++) {
    if(isTimeSliceExpired(collector.slices[i])) {
      collector.slices[i] = null;
    }
  }

  collector.slices = _.compact(collector.slices);
};


/////////////////////////////////////////////////////////////////////////////////////////
//
// Publicly Exported Collector Class
//
/////////////////////////////////////////////////////////////////////////////////////////

/**
 * Create a new, empty instance of the Collector.
 *
 * @class Collector
 * @constructor
 */
var Collector = exports.Collector = function() {
  this.current = createTimeSlice();
  this.slices = [];
};


/**
 * Records a set of metrics with the current time.
 *
 * Each datum that you would like to record is represented as an
 * object literal where the keys are the stat buckets and the values
 * are what you would like to record. The key 'type' must also be
 * present and contain one of the exported Type values. An example
 * parameter would be:
 *
 *   {type: stats.Type.Count calls: 1, errors: 0, success: 1}
 *
 * This would apply the Count metric type to calls, errors and success
 * buckets.
 *
 * This method is vardic is nature and can be supplied multiple object
 * literals.
 *
 * @class Collector
 * @method record
 */
Collector.prototype.record = function() {
  var current,
      start = Date.now();

  rollSlice(this);
  compactSlices(this);

  current = this.current;
  _.each(arguments, function(data) {
    var statFn = data.type,
        points = _(data).omit("type").pairs().valueOf();

    if(!statFn) {
      log.warn("data point missing type - %s", data);
      return;
    }

    for(var i = 0; i < points.length; i++) {
      var key = points[i][0],
          val = points[i][1] || 0,
          existingVal = current.buckets[key] || 0;

      current.buckets[key] = statFn(existingVal, val);
    }
  });

  log.info("stat record took %s ms", Date.now() - start);
};


/**
 * Collapses the time series data according to the rules we've defined.
 *
 * @param options An object with conditional parameters to use when
 *                summarizing the data.
 */
Collector.prototype.summarize = function(options) {
  // TODO: remove the static return and return actual data
  return {errors: 0, messages: 1000232};
};


/////////////////////////////////////////////////////////////////////////////////////////
//
// Types of Stats Supported
//
/////////////////////////////////////////////////////////////////////////////////////////
exports.Type = {
  Midpoint: function(current, val) {
    current = _.isNumber(current) ? current : 0;
    val = _.isNumber(val) ? val : 0;

    return (current + val) / 2;
  },

  Count: function(current, val) {
    current = _.isNumber(current) ? Math.floor(current) : 0;
    val = _.isNumber(val) ? Math.floor(val) : 0;

    return current + val;
  }
};
