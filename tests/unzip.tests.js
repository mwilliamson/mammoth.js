var assert = require("assert");
var path = require("path");

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
    
    test("unzip can open local zip file", function() {
        var zipPath = path.join(__dirname, "test-data/hello.zip");
        return unzip.openZip({path: zipPath}).then(function(zipFile) {
            return zipFile.read("hello", "utf8");
        }).then(function(contents) {
            assert.equal(contents, "Hello world\n");
        });
    });
});
