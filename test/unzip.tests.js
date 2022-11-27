var fs = require("fs");
var assert = require("assert");
var path = require("path");
var util = require("util");

var test = require("./test")(module);
var unzip = require("../lib/unzip");

var readFile = util.promisify(fs.readFile);

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

test('unzip can open Buffer', function() {
    var zipPath = path.join(__dirname, "test-data/hello.zip");
    return readFile(zipPath)
        .then(function(buffer) {
            return unzip.openZip({buffer: buffer});
        })
        .then(function(zipFile) {
            return zipFile.read("hello", "utf8");
        })
        .then(function(contents) {
            assert.equal(contents, "Hello world\n");
        });
});
