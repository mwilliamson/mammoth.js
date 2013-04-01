var assert = require("assert");

var documents = require("../lib/documents");
var DocumentConverter = documents.DocumentConverter;
var test = require("./testing").test;
var styles = require("../lib/styles");


describe('DocumentConverter', function() {
    test('should convert document containing one paragraph to single p element', function() {
        var document = new documents.Document([
            paragraphOfText("Hello.")
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.html, "<p>Hello.</p>");
        });
    });
    
    test('ignores empty paragraphs', function() {
        var document = new documents.Document([
            paragraphOfText("")
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.html, "");
        });
    });
    
    test('can use non-default HTML element for unstyled paragraphs', function() {
        var document = new documents.Document([
            paragraphOfText("Hello.")
        ]);
        var converter = new DocumentConverter({defaultParagraphStyle: styles.topLevelElement("h1")});
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.html, "<h1>Hello.</h1>");
        });
    });
    
    test('text is HTML-escaped', function() {
        var document = new documents.Document([
            paragraphOfText("1 < 2")
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.html, "<p>1 &lt; 2</p>");
        });
    });
    
    test('should convert document containing multiple paragraphs to multiple p elements', function() {
        var document = new documents.Document([
            paragraphOfText("Hello."),
            paragraphOfText("Goodbye.")
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.html, "<p>Hello.</p><p>Goodbye.</p>");
        });
    });
    
    test('uses style mappings to pick HTML element for docx paragraph', function() {
        var document = new documents.Document([
            paragraphOfText("Hello.", "Heading1"),
        ]);
        var converter = new DocumentConverter({
            paragraphStyleMap: {
                "Heading1": styles.topLevelElement("h1")
            }
        });
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.html, "<h1>Hello.</h1>");
        });
    });
    
    test('can use stacked styles to generate nested HTML elements', function() {
        var document = new documents.Document([
            paragraphOfText("Hello.", "Heading1")
        ]);
        var converter = new DocumentConverter({
            paragraphStyleMap: {
                "Heading1": styles.elements(["h1", "span"])
            }
        });
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.html, "<h1><span>Hello.</span></h1>");
        });
    });
    
    test('bold runs are wrapped in <strong> tags', function() {
        var run = runOfText("Hello.", {isBold: true});
        var converter = new DocumentConverter();
        return converter.convertToHtml(run).then(function(result) {
            assert.equal(result.html, "<strong>Hello.</strong>");
        });
    });
    
    test('bold runs can exist inside other tags', function() {
        var run = new documents.Paragraph([
            runOfText("Hello.", {isBold: true})
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(run).then(function(result) {
            assert.equal(result.html, "<p><strong>Hello.</strong></p>");
        });
    });
    
    test('italic runs are wrapped in <em> tags', function() {
        var run = runOfText("Hello.", {isItalic: true});
        var converter = new DocumentConverter();
        return converter.convertToHtml(run).then(function(result) {
            assert.equal(result.html, "<em>Hello.</em>");
        });
    });
    
    test('run can be both bold and italic', function() {
        var run = runOfText("Hello.", {isBold: true, isItalic: true});
        var converter = new DocumentConverter();
        return converter.convertToHtml(run).then(function(result) {
            assert.equal(result.html, "<strong><em>Hello.</em></strong>");
        });
    });
});

function paragraphOfText(text, styleName) {
    var run = runOfText(text);
    return new documents.Paragraph([run], {
        styleName: styleName
    });
}

function runOfText(text, properties) {
    var textElement = new documents.Text(text);
    return new documents.Run([textElement], properties);
}
