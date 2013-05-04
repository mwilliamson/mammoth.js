var assert = require("assert");

var test = require("./testing").test;
var documentMatchers = require("../lib/document-matchers");
var documents = require("../lib/documents");
var Paragraph = documents.Paragraph;

describe("document-matchers", function() {
    test("paragraph with no style name matches any paragraph", function() {
        var matcher = documentMatchers.paragraph();
        assert.ok(matcher.matches(new Paragraph()));
        assert.ok(matcher.matches(paragraphWithStyle("Heading1")));
    });
    
    test("paragraph style name only matches paragraphs with that style", function() {
        var matcher = documentMatchers.paragraph("Heading1");
        assert.ok(!matcher.matches(new Paragraph()));
        assert.ok(matcher.matches(paragraphWithStyle("Heading1")));
        assert.ok(!matcher.matches(paragraphWithStyle("Heading2")));
    });
    
    test("ordered-list(index) matches an ordered list with specified level index", function() {
        var matcher = documentMatchers.paragraph().orderedList(1);
        assert.ok(!matcher.matches(new Paragraph()));
        assert.ok(matcher.matches(new Paragraph([], {numbering: {level: 1, isOrdered: true}})));
        assert.ok(!matcher.matches(new Paragraph([], {numbering: {level: 0, isOrdered: true}})));
        assert.ok(!matcher.matches(new Paragraph([], {numbering: {level: 1, isOrdered: false}})));
    });
    
    test("unordered-list(index) matches an unordered list with specified level index", function() {
        var matcher = documentMatchers.paragraph().unorderedList(1);
        assert.ok(!matcher.matches(new Paragraph()));
        assert.ok(matcher.matches(new Paragraph([], {numbering: {level: 1, isOrdered: false}})));
        assert.ok(!matcher.matches(new Paragraph([], {numbering: {level: 1, isOrdered: true}})));
    });
    
    test("matchers for lists with index 0 do not match elements that are not lists", function() {
        var matcher = documentMatchers.paragraph().orderedList(0);
        assert.ok(!matcher.matches(new Paragraph()));
    });
});

function paragraphWithStyle(styleName) {
    return new Paragraph([], {styleName: styleName});
}
