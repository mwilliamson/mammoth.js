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
        assert.equal(uriToPath("file:///a/b/c", "linux"), "/a/b/c");
        assert.equal(uriToPath("file:///a/b/c", "win32"), "/a/b/c");
    });
    
    test("URI is unquoted", function() {
        assert.equal(uriToPath("file:///a%20b"), "/a b");
    });
    
    test("when host is set to localhost then path can be found", function() {
        assert.equal(uriToPath("file://localhost/a/b/c"), "/a/b/c");
    });
    
    test("when host is set but not localhost then path cannot be found", function() {
        assert.throws(function() { uriToPath("file://example/a/b/c"); }, /Could not convert URI to path: file:\/\/example\/a\/b\/c/);
    });
    
    test("leading slash is not dropped on Windows file URIs when platform is not Windows", function() {
        assert.equal(uriToPath("file:///c:/a", "linux"), "/c:/a");
    });
    
    test("leading slash is dropped on Windows file URIs when platform is Windows", function() {
        assert.equal(uriToPath("file:///c:/a", "win32"), "c:/a");
        assert.equal(uriToPath("file:///C:/a", "win32"), "C:/a");
    });
});
