var assert = require("assert");

var test = require("./testing").test;
var documentMatchers = require("../lib/document-matchers");
var documents = require("../lib/documents");
var Paragraph = documents.Paragraph;

describe("document-matchers", function() {
    test("paragraph with no options matches any paragraph", function() {
        var matcher = documentMatchers.paragraph();
        assert.ok(matcher.matches(new Paragraph()));
        assert.ok(matcher.matches(paragraphWithStyleId("Heading1")));
    });
    
    test("paragraph style ID only matches paragraphs with that style ID", function() {
        var matcher = documentMatchers.paragraph({styleId: "Heading1"});
        assert.ok(!matcher.matches(new Paragraph()));
        assert.ok(matcher.matches(paragraphWithStyleId("Heading1")));
        assert.ok(!matcher.matches(paragraphWithStyleId("Heading2")));
    });
    
    test("ordered-list(index) matches an ordered list with specified level index", function() {
        var matcher = documentMatchers.paragraph({list: {isOrdered: true, levelIndex: 1}});
        assert.ok(!matcher.matches(new Paragraph()));
        assert.ok(matcher.matches(new Paragraph([], {numbering: {level: 1, isOrdered: true}})));
        assert.ok(!matcher.matches(new Paragraph([], {numbering: {level: 0, isOrdered: true}})));
        assert.ok(!matcher.matches(new Paragraph([], {numbering: {level: 1, isOrdered: false}})));
    });
    
    test("unordered-list(index) matches an unordered list with specified level index", function() {
        var matcher = documentMatchers.paragraph({list: {isOrdered: false, levelIndex: 1}});
        assert.ok(!matcher.matches(new Paragraph()));
        assert.ok(matcher.matches(new Paragraph([], {numbering: {level: 1, isOrdered: false}})));
        assert.ok(!matcher.matches(new Paragraph([], {numbering: {level: 1, isOrdered: true}})));
    });
    
    test("matchers for lists with index 0 do not match elements that are not lists", function() {
        var matcher = documentMatchers.paragraph({list: {isOrdered: true, levelIndex: 0}});
        assert.ok(!matcher.matches(new Paragraph()));
    });
});

function paragraphWithStyleId(styleId) {
    return new Paragraph([], {styleId: styleId});
}
