var assert = require("assert");

var test = require("./testing").test;
var unzip = require("../lib/unzip");

describe("unzip", function() {
    test("unzip fails if given empty object", function() {
        return unzip.openZip({}).then(function() {
            assert.ok(false, "Expected failure");
        }, function(error) {
            assert.equal("Could not find file in options", error.message);
        });
    });
});
