var assert = require("assert");

var test = require("./testing").test;
var documentMatchers = require("../lib/document-matchers");
var documents = require("../lib/documents");


describe("document-matchers", function() {
    test("paragraph with no style name matches any paragraph", function() {
        var matcher = documentMatchers.paragraph();
        assert.ok(matcher.matches(new documents.Paragraph()));
        assert.ok(matcher.matches(new paragraphWithStyle("Heading1")));
    });
    
    test("paragraph style name only matches paragraphs with that style", function() {
        var matcher = documentMatchers.paragraph("Heading1");
        assert.ok(!matcher.matches(new documents.Paragraph()));
        assert.ok(matcher.matches(paragraphWithStyle("Heading1")));
        assert.ok(!matcher.matches(paragraphWithStyle("Heading2")));
    });
});

function paragraphWithStyle(styleName) {
    return new documents.Paragraph([], {styleName: styleName});
}
