var _ = require("lodash"),
    drain = require("../../lib/drains/web.js");

describe("The web drain module's", function() {

  describe("findOpenIndex function", function() {
    it("should return 0 when an empty array is supplied", function() {
      var testArray = [];
      expect(drain.findOpenIndex(testArray)).toBe(0);
    });

    it("should return the last open index (length) for full arrays", function() {
      var testArray = [1, 2, 3];
      expect(drain.findOpenIndex(testArray)).toBe(3);
    });

    it("should return the first index if set to null", function() {
      var testArray = [null, 2, 3];
      expect(drain.findOpenIndex(testArray)).toBe(0);
    });

    it("should return the first index if set to undefined", function() {
      var testArray = [undefined, 2, 3];
      expect(drain.findOpenIndex(testArray)).toBe(0);
    });

    it("should return the correct mid array index if set to null", function() {
      var testArray = [1, null, 3, 4];
      expect(drain.findOpenIndex(testArray)).toBe(1);
    });

    it("should return the correct mid array index if set to undefined", function() {
      var testArray = [1, undefined, 3, 4];
      expect(drain.findOpenIndex(testArray)).toBe(1);
    });

    it("should return the first null value index", function() {
      var testArray = [1, null, 3, null, 5];
      expect(drain.findOpenIndex(testArray)).toBe(1);
    });

    it("should return the first undefined value index", function() {
      var testArray = [1, undefined, 3, undefined, 5];
      expect(drain.findOpenIndex(testArray)).toBe(1);
    });
  });



  describe("fetchSocketIndex function", function() {
    var newClientGuid = "guid-9876",
        existingClientGuid = "guid-1234",
        socketList = ["socketA", "socketB", "socketC"];

    beforeEach(function() {
      drain.clientMap[existingClientGuid] = socketList;
    });

    afterEach(function() {
      delete drain.clientMap[existingClientGuid];
      delete drain.clientMap[newClientGuid];
    });

    it("should create and return new client map when guid not in map", function() {
      var actualClientMap = drain.fetchSocketList(newClientGuid);
      expect(actualClientMap).toEqual([]);
      expect(_.has(drain.clientMap, newClientGuid)).toBe(true);
    });

    it("should return existing socket collection when guid is in map.", function() {
      var actualClientMap = drain.fetchSocketList(existingClientGuid);
      expect(actualClientMap).toEqual(socketList);
      expect(_.keys(drain.clientMap).length).toBe(1);
    });

    it("should not create new socket collection and return undefined when guid is null.", function() {
      var actualClientMap = drain.fetchSocketList(null);
      expect(actualClientMap).toBe(undefined);
      expect(_.keys(drain.clientMap).length).toBe(1);
    });

    it("should not create new socket collection and return undefined when guid is undefined.", function() {
      var actualClientMap = drain.fetchSocketList(undefined);
      expect(actualClientMap).toBe(undefined);
      expect(_.keys(drain.clientMap).length).toBe(1);
    });

    it("should not create new socket collection and return undefined when guid is function.", function() {
      var actualClientMap = drain.fetchSocketList(function() {});
      expect(actualClientMap).toBe(undefined);
      expect(_.keys(drain.clientMap).length).toBe(1);
    });
  });



  describe("clearSocketFromList function", function() {
    afterEach(function() {
      _.keys(drain.clientMap).forEach(function(key) {
        delete drain.clientMap[key];
      });
    });

    it("should null particular socket index", function() {
      drain.clientMap["guid-1234"] = ["a", "b", "c"];
      drain.clearSocketFromList("guid-1234", 1);
      expect(drain.clientMap["guid-1234"]).toEqual(["a", null, "c"]);
    });

    it("should remove entry from client map when socket list is all null", function() {
      drain.clientMap["guid-1234"] = ["a", "b", "c"];
      drain.clearSocketFromList("guid-1234", 1);
      drain.clearSocketFromList("guid-1234", 0);
      drain.clearSocketFromList("guid-1234", 2);

      expect(_.has(drain.clientMap, "guid-1234")).toBe(false);
    });
  });

});
