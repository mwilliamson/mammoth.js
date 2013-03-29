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
            assert.equal("<p>Hello.</p>", result.html);
        });
    });
    
    test('text is HTML-escaped', function() {
        var document = new documents.Document([
            paragraphOfText("1 < 2")
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal("<p>1 &lt; 2</p>", result.html);
        });
    });
    
    test('should convert document containing multiple paragraphs to multiple p elements', function() {
        var document = new documents.Document([
            paragraphOfText("Hello."),
            paragraphOfText("Goodbye.")
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal("<p>Hello.</p><p>Goodbye.</p>", result.html);
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
            assert.equal("<h1>Hello.</h1>", result.html);
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
            assert.equal("<h1><span>Hello.</span></h1>", result.html);
        });
    });
});

function paragraphOfText(text, styleName) {
    var run = runOfText(text);
    return new documents.Paragraph([run], {
        styleName: styleName
    });
}

function runOfText(text) {
    var textElement = new documents.Text(text);
    return new documents.Run([textElement]);
}
