var assert = require("assert");
var q = require("q");

var documents = require("../lib/documents");
var DocumentConverter = require("../lib/document-to-html").DocumentConverter;
var test = require("./testing").test;
var htmlPaths = require("../lib/html-paths");
var xmlreader = require("../lib/xmlreader");


describe('DocumentConverter', function() {
    test('should empty document to empty string', function() {
        var document = new documents.Document([]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.html, "");
        });
    });
    
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
        var converter = new DocumentConverter({
            defaultParagraphStyle: htmlPaths.topLevelElement("h1")
        });
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
                "Heading1": htmlPaths.topLevelElement("h1")
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
                "Heading1": htmlPaths.elements(["h1", "span"])
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
    
    test('run styles are converted to HTML if mapping exists', function() {
        var run = runOfText("Hello.", {styleName: "Emphasis"});
        var converter = new DocumentConverter({
            runStyleMap: {
                "Emphasis": htmlPaths.elements(["strong"])
            }
        });
        return converter.convertToHtml(run).then(function(result) {
            assert.equal(result.html, "<strong>Hello.</strong>");
        });
    });
    
    test('docx hyperlink is converted to <a>', function() {
        var hyperlink = new documents.Hyperlink(
            [runOfText("Hello.")],
            {href: "http://www.example.com"}
        );
        var converter = new DocumentConverter();
        return converter.convertToHtml(hyperlink).then(function(result) {
            assert.equal(result.html, '<a href="http://www.example.com">Hello.</a>');
        });
    });
    
    test('images are written with data URIs', function() {
        var imageBuffer = new Buffer("Not an image at all!");
        var image = new documents.Image(
            function(encoding) {
                return q.when(imageBuffer.toString(encoding));
            }
        );
        var converter = new DocumentConverter();
        return converter.convertToHtml(image).then(function(result) {
            assert.equal(result.html, '<img src="data:image/png;base64,' + imageBuffer.toString("base64") + '" />');
        });
    });
    
    test('images have alt attribute if available', function() {
        var imageBuffer = new Buffer("Not an image at all!");
        var image = new documents.Image(
            function() {
                return q.when(imageBuffer);
            },
            "It's a hat"
        );
        var converter = new DocumentConverter();
        return converter.convertToHtml(image)
            .then(function(result) {
                return xmlreader.read(result.html);
            })
            .then(function(htmlImageElementDocument) {
                var htmlImageElement = htmlImageElementDocument.root;
                assert.equal(htmlImageElement.attributes.alt, "It's a hat");
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
