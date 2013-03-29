var assert = require("assert");

var documents = require("../lib/documents");
var DocumentConverter = documents.DocumentConverter;
var test = require("./testing").test;


describe('DocumentConverter', function() {
    test('should convert document containing one paragraph to single p element', function() {
        var document = new documents.Document([
            paragraphOfText("Hello.")
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal("<p>Hello.</p>", result.html);
        });
    })
});


describe('DocumentConverter', function() {
    test('should convert document containing multiple paragraphs to multiple p elements', function() {
        var document = new documents.Document([
            paragraphOfText("Hello."),
            paragraphOfText("Goodbye.")
        ]);
        var converter = new DocumentConverter();
        return converter.convertToHtml(document).then(function(result) {
            assert.equal("<p>Hello.</p><p>Goodbye.</p>", result.html);
        });
    })
});

function paragraphOfText(text) {
    var run = runOfText(text);
    return new documents.Paragraph([run]);
}

function runOfText(text) {
    var textElement = new documents.Text(text);
    return new documents.Run([textElement]);
}
