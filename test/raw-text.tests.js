var assert = require("assert");

var documents = require("../lib/documents");
var test = require("./test")(module);
var convertElementToRawText = require("../lib/raw-text").convertElementToRawText;


test('text node is converted to text content', function() {
    var element = new documents.Text("Hello.");

    var result = convertElementToRawText(element);

    assert.strictEqual(result, "Hello.");
});

test('paragraphs are terminated with newlines', function() {
    var element = new documents.Paragraph(
        [
            new documents.Text("Hello "),
            new documents.Text("world.")
        ],
        {}
    );

    var result = convertElementToRawText(element);

    assert.strictEqual(result, "Hello world.\n\n");
});

test('children recursively are converted to text', function() {
    var element = new documents.Document([
        new documents.Paragraph(
            [
                new documents.Text("Hello "),
                new documents.Text("world.")
            ],
            {}
        )
    ]);

    var result = convertElementToRawText(element);

    assert.strictEqual(result, "Hello world.\n\n");
});


test('non-text element without children is converted to empty string', function() {
    var element = documents.lineBreak;

    var result = convertElementToRawText(element);

    assert.strictEqual(result, "");
});
