var stats = require("../lib/stats.js");

describe("The stats module", function() {

  describe("Midpoint function", function() {
    it("should return an integer midpoint of two integers", function() {
      expect(stats.Type.Midpoint(9,1)).toEqual(5);
    });

    it("should return float midpoint of two integers", function() {
      expect(stats.Type.Midpoint(8,1)).toEqual(4.5);
    });

    it("should return the float midpoint of an integer and a float", function() {
      expect(stats.Type.Midpoint(8.5, 1)).toEqual(4.75);
    });

    it("should return the float midpoint of two floats", function() {
      expect(stats.Type.Midpoint(8.5, 1.0)).toEqual(4.75);
    });

    it("should default parameter to 0 if string", function() {
      expect(stats.Type.Midpoint("9", 1)).toEqual(0.5);
      expect(stats.Type.Midpoint(9, "1")).toEqual(4.5);
    });

    it("should default parameter to 0 if null", function() {
      expect(stats.Type.Midpoint(null, 1)).toEqual(0.5);
      expect(stats.Type.Midpoint(9, null)).toEqual(4.5);
    });

    it("should default parameter to 0 if undefined", function() {
      expect(stats.Type.Midpoint(undefined, 1)).toEqual(0.5);
      expect(stats.Type.Midpoint(9, undefined)).toEqual(4.5);
    });

    it("should default parameter to 0 if an object", function() {
      expect(stats.Type.Midpoint({}, 1)).toEqual(0.5);
      expect(stats.Type.Midpoint(9, {})).toEqual(4.5);
    });

    it("should default parameter to 0 if an array", function() {
      expect(stats.Type.Midpoint([], 1)).toEqual(0.5);
      expect(stats.Type.Midpoint(9, [])).toEqual(4.5);
    });

    it("should default parameter to 0 if a function", function() {
      expect(stats.Type.Midpoint(function() {}, 1)).toEqual(0.5);
      expect(stats.Type.Midpoint(9, function() {})).toEqual(4.5);
    });
  });




  describe("Count function", function() {
    it("should return an integer addition of two integers", function() {
      expect(stats.Type.Count(9,1)).toEqual(10);
    });

    it("should apply floor to floating point values to produce an integer", function() {
      expect(stats.Type.Count(8.6, 1)).toEqual(9);
      expect(stats.Type.Count(8, 1.9)).toEqual(9);
    });

    it("should default parameter to 0 if string", function() {
      expect(stats.Type.Count("9", 1)).toEqual(1);
      expect(stats.Type.Count(9, "1")).toEqual(9);
    });

    it("should default parameter to 0 if null", function() {
      expect(stats.Type.Count(null, 1)).toEqual(1);
      expect(stats.Type.Count(9, null)).toEqual(9);
    });

    it("should default parameter to 0 if undefined", function() {
      expect(stats.Type.Count(undefined, 1)).toEqual(1);
      expect(stats.Type.Count(9, undefined)).toEqual(9);
    });

    it("should default parameter to 0 if an object", function() {
      expect(stats.Type.Count({}, 1)).toEqual(1);
      expect(stats.Type.Count(9, {})).toEqual(9);
    });

    it("should default parameter to 0 if an array", function() {
      expect(stats.Type.Count([], 1)).toEqual(1);
      expect(stats.Type.Count(9, [])).toEqual(9);
    });

    it("should default parameter to 0 if a function", function() {
      expect(stats.Type.Count(function() {}, 1)).toEqual(1);
      expect(stats.Type.Count(9, function() {})).toEqual(9);
    });
  });



  describe("Collector constructor", function() {
    it("should create an empty array for historic slices", function() {
      var col = new stats.Collector();
      expect(col.slices).toEqual([]);
    });

    it("should create a current slice object", function() {
      var col = new stats.Collector();
      expect(col.current).toBeDefined();
    });
  });



  describe("record function", function() {
    var collector;

    beforeEach(function() {
      collector = new stats.Collector();
    });

    it("should add a new bucket with values if one doesn't exist", function() {
      collector.record({
        type: stats.Type.Count,
        calls: 11
      });
      expect(collector.current.buckets.calls).toBe(11);
    });

    it("should apply the type function to any existing value and argument", function() {
      collector.current.buckets.calls = 11;

      collector.record({
        type: stats.Type.Count,
        calls: 1
      });

      expect(collector.current.buckets.calls).toBe(12);
    });

    it("should process all defined buckets on a single object argument", function() {
      collector.record({
        type: stats.Type.Count,
        calls: 2,
        errors: 2
      });

      expect(collector.current.buckets.calls).toBe(2);
      expect(collector.current.buckets.errors).toBe(2);
    });

    it("should process all defined arguments as separate events", function() {
      collector.record(
        {type: stats.Type.Count, calls: 1},
        {type: stats.Type.Midpoint, time: 0.234});

      expect(collector.current.buckets.calls).toBe(1);
      expect(collector.current.buckets.time).toBe(0.117);
    });

    it("should roll old time slices before recording new stats", function() {
      collector.current.buckets.calls = 10;
      collector.current.end = Date.now() - 1;

      collector.record({
        type: stats.Type.Count,
        calls: 1
      });

      expect(collector.slices.length).toBe(1);
      expect(collector.slices[0].buckets.calls).toBe(10);
      expect(collector.current.buckets.calls).toBe(1);
    });

    it("should save memory by not rolling the current slice if the bucket is empty", function() {
      collector.current.end = Date.now() - 1;

      collector.record({
        type: stats.Type.Count,
        calls: 1
      });

      expect(collector.slices.length).toBe(0);
      expect(collector.current.buckets.calls).toBe(1);
    });

    it("should purge slices if their TTL is due", function() {
      collector.current.buckets.calls = 10;
      collector.current.end = Date.now() - 10;
      collector.current.ttl = Date.now() - 1;

      collector.record({
        type: stats.Type.Count,
        calls: 1
      });

      expect(collector.slices.length).toBe(0);
      expect(collector.current.buckets.calls).toBe(1);
    });
  });

});
