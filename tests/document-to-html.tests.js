var assert = require("assert");
var q = require("q");

var documents = require("../lib/documents");
var DocumentConverter = require("../lib/document-to-html").DocumentConverter;
var test = require("./testing").test;
var htmlPaths = require("../lib/html-paths");
var xmlreader = require("../lib/xmlreader");
var results = require("../lib/results");
var documentMatchers = require("../lib/document-matchers");


describe('DocumentConverter', function() {
    test('should empty document to empty string', function() {
        var document = new documents.Document([]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.value, "");
        });
    });
    
    test('should convert document containing one paragraph to single p element', function() {
        var document = new documents.Document([
            paragraphOfText("Hello.")
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.value, "<p>Hello.</p>");
        });
    });
    
    test('ignores empty paragraphs', function() {
        var document = new documents.Document([
            paragraphOfText("")
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.value, "");
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
            assert.equal(result.value, "<h1>Hello.</h1>");
        });
    });
    
    test('text is HTML-escaped', function() {
        var document = new documents.Document([
            paragraphOfText("1 < 2")
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.value, "<p>1 &lt; 2</p>");
        });
    });
    
    test('should convert document containing multiple paragraphs to multiple p elements', function() {
        var document = new documents.Document([
            paragraphOfText("Hello."),
            paragraphOfText("Goodbye.")
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.value, "<p>Hello.</p><p>Goodbye.</p>");
        });
    });
    
    test('uses style mappings to pick HTML element for docx paragraph', function() {
        var document = new documents.Document([
            paragraphOfText("Hello.", "Heading1"),
        ]);
        var converter = new DocumentConverter({
            styleMap: [
                {
                    from: documentMatchers.paragraph("Heading1"),
                    to: htmlPaths.topLevelElement("h1")
                }
            ]
        });
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.value, "<h1>Hello.</h1>");
        });
    });
    
    test('warning is emitted if paragraph style is unrecognised', function() {
        var document = new documents.Document([
            paragraphOfText("Hello.", "Heading1"),
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.deepEqual(result.messages, [results.warning("Unrecognised paragraph style: Heading1")]);
        });
    });
    
    test('can use stacked styles to generate nested HTML elements', function() {
        var document = new documents.Document([
            paragraphOfText("Hello.", "Heading1")
        ]);
        var converter = new DocumentConverter({
            styleMap: [
                {
                    from: documentMatchers.paragraph("Heading1"),
                    to: htmlPaths.elements(["h1", "span"])
                }
            ]
        });
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.value, "<h1><span>Hello.</span></h1>");
        });
    });
    
    test('bold runs are wrapped in <strong> tags', function() {
        var run = runOfText("Hello.", {isBold: true});
        var converter = new DocumentConverter();
        return converter.convertToHtml(run).then(function(result) {
            assert.equal(result.value, "<strong>Hello.</strong>");
        });
    });
    
    test('bold runs can exist inside other tags', function() {
        var run = new documents.Paragraph([
            runOfText("Hello.", {isBold: true})
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(run).then(function(result) {
            assert.equal(result.value, "<p><strong>Hello.</strong></p>");
        });
    });
    
    test('italic runs are wrapped in <em> tags', function() {
        var run = runOfText("Hello.", {isItalic: true});
        var converter = new DocumentConverter();
        return converter.convertToHtml(run).then(function(result) {
            assert.equal(result.value, "<em>Hello.</em>");
        });
    });
    
    test('run can be both bold and italic', function() {
        var run = runOfText("Hello.", {isBold: true, isItalic: true});
        var converter = new DocumentConverter();
        return converter.convertToHtml(run).then(function(result) {
            assert.equal(result.value, "<strong><em>Hello.</em></strong>");
        });
    });
    
    test('run styles are converted to HTML if mapping exists', function() {
        var run = runOfText("Hello.", {styleName: "Emphasis"});
        var converter = new DocumentConverter({
            styleMap: [
                {
                    from: documentMatchers.run("Emphasis"),
                    to: htmlPaths.elements(["strong"])
                }
            ]
        });
        return converter.convertToHtml(run).then(function(result) {
            assert.equal(result.value, "<strong>Hello.</strong>");
        });
    });
    
    test('warning is emitted if run style is unrecognised', function() {
        var run = runOfText("Hello.", {styleName: "Emphasis"});
        var converter = new DocumentConverter();
        return converter.convertToHtml(run).then(function(result) {
            assert.deepEqual(result.messages, [results.warning("Unrecognised run style: Emphasis")]);
        });
    });
    
    test('docx hyperlink is converted to <a>', function() {
        var hyperlink = new documents.Hyperlink(
            [runOfText("Hello.")],
            {href: "http://www.example.com"}
        );
        var converter = new DocumentConverter();
        return converter.convertToHtml(hyperlink).then(function(result) {
            assert.equal(result.value, '<a href="http://www.example.com">Hello.</a>');
        });
    });
    
    test('docx tab is converted to tab in HTML', function() {
        var tab = new documents.Tab();
        var converter = new DocumentConverter();
        return converter.convertToHtml(tab).then(function(result) {
            assert.equal(result.value, "\t");
        });
    });
    
    test('images are written with data URIs', function() {
        var imageBuffer = new Buffer("Not an image at all!");
        var image = new documents.Image({
            readImage: function(encoding) {
                return q.when(imageBuffer.toString(encoding));
            },
            contentType: "image/png"
        });
        var converter = new DocumentConverter();
        return converter.convertToHtml(image).then(function(result) {
            assert.equal(result.value, '<img src="data:image/png;base64,' + imageBuffer.toString("base64") + '" />');
        });
    });
    
    test('images have alt attribute if available', function() {
        var imageBuffer = new Buffer("Not an image at all!");
        var image = new documents.Image({
            readImage: function() {
                return q.when(imageBuffer);
            },
            altText: "It's a hat"
        });
        var converter = new DocumentConverter();
        return converter.convertToHtml(image)
            .then(function(result) {
                return xmlreader.read(result.value);
            })
            .then(function(htmlImageElementDocument) {
                var htmlImageElement = htmlImageElementDocument.root;
                assert.equal(htmlImageElement.attributes.alt, "It's a hat");
            });
    });
    
    test('can add custom handler for images', function() {
        var imageBuffer = new Buffer("Not an image at all!");
        var image = new documents.Image({
            readImage: function(encoding) {
                return q.when(imageBuffer.toString(encoding));
            },
            contentType: "image/png"
        });
        var converter = new DocumentConverter({
            convertImage: function(element, html, messages, callback) {
                element.read("utf8").then(function(altText) {
                    html.selfClosing(htmlPaths.element("img", {alt: altText}));
                    callback();
                });
            }
        });
        return converter.convertToHtml(image).then(function(result) {
            assert.equal(result.value, '<img alt="Not an image at all!" />');
        });
    });
    
    test('long documents do not cause stack overflow', function() {
        var paragraphs = [];
        for (var i = 0; i < 1000; i++) {
            paragraphs.push(paragraphOfText("Hello."));
        }
        var document = new documents.Document(paragraphs);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal(result.value.indexOf("<p>Hello.</p>"), 0);
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
