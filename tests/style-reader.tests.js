var assert = require("assert");
var htmlPaths = require("../lib/html-paths");
var documentMatchers = require("../lib/document-matchers");
var styleReader = require("../lib/style-reader");
var test = require("./testing").test;


var readHtmlPath = styleReader.readHtmlPath;
var readDocumentMatcher = styleReader.readDocumentMatcher;
var readStyle = styleReader.readStyle;


describe('styleReader.readHtmlPath', function() {
    test('reads single element', function() {
        assert.deepEqual(readHtmlPath("p"), htmlPaths.elements(["p"]));
    });
    
    test('reads choice of elements', function() {
        assert.deepEqual(
            readHtmlPath("ul|ol"),
            htmlPaths.elements([
                htmlPaths.element(["ul", "ol"])
            ])
        );
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
});

describe("styleReader.readDocumentMatcher", function() {
    test("reads plain paragraph", function() {
        assert.deepEqual(readDocumentMatcher("p"), documentMatchers.paragraph());
    });
    
    test("reads paragraph with style name", function() {
        assert.deepEqual(
            readDocumentMatcher("p.Heading1"),
            documentMatchers.paragraph("Heading1")
        );
    });
    
    test("reads p:ordered-list(1) as ordered list with index of 0", function() {
        assert.deepEqual(
            readDocumentMatcher("p:ordered-list(1)"),
            documentMatchers.paragraph().orderedList(0)
        );
    });
    
    test("reads p:unordered-list(1) as unordered list with index of 0", function() {
        assert.deepEqual(
            readDocumentMatcher("p:unordered-list(1)"),
            documentMatchers.paragraph().unorderedList(0)
        );
    });
    
    test("reads plain run", function() {
        assert.deepEqual(
            readDocumentMatcher("r"),
            documentMatchers.run()
        );
    });
});

describe("styleReader.read", function() {
    test("document matcher is mapped to HTML path using arrow", function() {
        assert.deepEqual(
            readStyle("p => h1"),
            {
                from: documentMatchers.paragraph(),
                to: htmlPaths.elements(["h1"])
            }
        );
    });
});
