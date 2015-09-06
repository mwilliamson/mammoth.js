var path = require("path");
var fs = require("fs");
var assert = require("assert");

var promises = require("../../lib/promises");
var Files = require("../../lib/docx/files").Files;
var uriToPath = require("../../lib/docx/files").uriToPath;

var testing = require("../testing");
var test = testing.test;

var readFile = promises.promisify(fs.readFile.bind(fs));


describe("Files", function() {
    test("can open files with file URI", function() {
        var filePath = path.resolve(testing.testPath("tiny-picture.png"));
        var files = new Files(null);
        return files.read("file:///" + filePath.replace(/^\//, ""), "base64").then(function(contents) {
            return readFile(filePath, "base64").then(function(expectedContents) {
                assert.deepEqual(contents, expectedContents);
            });
        });
    });
});


describe("uriToPath", function() {
    test("leading slash is retained on non-Windows file URIs", function() {
        assert.equal(uriToPath("file:///a/b/c"), "/a/b/c");
    });
    
    test("URI is unquoted", function() {
        assert.equal(uriToPath("file:///a%20b"), "/a b");
    });
});
