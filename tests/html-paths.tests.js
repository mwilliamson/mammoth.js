var assert = require("assert");

var test = require("./testing").test;
var htmlPaths = require("../lib/html-paths");


describe("html-paths", function() {
    test("element can match multiple tag names", function() {
        var pathPart = htmlPaths.element(["ul", "ol"]);
        assert.ok(pathPart.matchesElement({tagName: "ul"}));
        assert.ok(pathPart.matchesElement({tagName: "ol"}));
        assert.ok(!pathPart.matchesElement({tagName: "p"}));
    });
});

