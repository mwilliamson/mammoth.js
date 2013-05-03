var assert = require("assert");
var htmlPaths = require("../lib/html-paths");
var styleReader = require("../lib/style-reader");
var test = require("./testing").test;


var readHtmlPath = styleReader.readHtmlPath;


describe('styleReader.readHtmlPath', function() {
    test('reads single element', function() {
        assert.deepEqual(readHtmlPath("p"), htmlPaths.elements(["p"]));
    });
    
    test('reads nested elements', function() {
        assert.deepEqual(readHtmlPath("ul > li"), htmlPaths.elements(["ul", "li"]));
    });
    
    test('reads class on element', function() {
        var expected = htmlPaths.elements([
            htmlPaths.element("p", {"class": "tip"})
        ])
        assert.deepEqual(readHtmlPath("p.tip"), expected);
    });
    
    test('reads multiple classes on element', function() {
        var expected = htmlPaths.elements([
            htmlPaths.element("p", {"class": "tip help"})
        ])
        assert.deepEqual(readHtmlPath("p.tip.help"), expected);
    });
    
    test('reads when element must be fresh', function() {
        var expected = htmlPaths.elements([
            htmlPaths.element("p", {}, {"fresh": true})
        ])
        assert.deepEqual(readHtmlPath("p:fresh"), expected);
    });
})
