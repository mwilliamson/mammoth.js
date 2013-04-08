var assert = require("assert");
var htmlPaths = require("../lib/html-paths");
var styleReader = require("../lib/style-reader");
var test = require("./testing").test;


describe('styleReader.read', function() {
    test('reads single element', function() {
        assert.deepEqual(styleReader.read("p"), htmlPaths.elements(["p"]));
    });
    
    test('reads nested elements', function() {
        assert.deepEqual(styleReader.read("ul > li"), htmlPaths.elements(["ul", "li"]));
    });
    
    test('reads class on element', function() {
        var expected = htmlPaths.elements([
            htmlPaths.element("p", {"class": "tip"})
        ])
        assert.deepEqual(styleReader.read("p.tip"), expected);
    });
    
    test('reads multiple classes on element', function() {
        var expected = htmlPaths.elements([
            htmlPaths.element("p", {"class": "tip help"})
        ])
        assert.deepEqual(styleReader.read("p.tip.help"), expected);
    });
    
    test('reads when element must be fresh', function() {
        var expected = htmlPaths.elements([
            htmlPaths.element("p", {}, {"fresh": true})
        ])
        assert.deepEqual(styleReader.read("p:fresh"), expected);
    });
})
