/*
 * Bullhorn: Get your message heard
 *
 * Copyright (C) 2014
 * Licensed under the GNU Lesser General Public License v3
 */
var common = require("../../../../lib/services/api/routes/common.js");


describe("The common API route module", function() {
    var mockLog = jasmine.createSpyObj("log", ["trace", "debug", "info", "warn", "error"]);

    describe("authorize() restify handler", function() {
        it("", function() {
            var mockConf = {
                    get: function() {
                        return "DEVONLY";
                    }
                }, 
                mockNext = jasmine.createSpy("next"),
                response = {},
                request = {
                    local: {},
                    authorization: {
                        scheme: "X-Jetway-API-Key",
                        credentials: "94f995a0-1ff9-11e4-8734-57e30f75f87a=x4Lwm6vETwKuc7D9m3Kfcn47nb7UM4AXw39dvJyZmCcwSrt4a/yruDZ2I7WPvENq1xu8A4pUXAR3ke6G2iZKrA=="
                    }
                };
            
            common(mockLog, mockConf).authorize(request, response, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(request.local.accessKeyId).toBe("94f995a0-1ff9-11e4-8734-57e30f75f87a");
        });
    }); // end of authorize() restify handler

});