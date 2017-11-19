var assert = require("assert");

var docxReader = require("../../lib/docx/docx-reader");
var documents = require("../../lib/documents");

var testing = require("../testing");
var test = require("../test")(module);
var testData = testing.testData;
var createFakeDocxFile = testing.createFakeDocxFile;


test("can read document with single paragraph with single run of text", function() {
    var expectedDocument = documents.Document([
        documents.Paragraph([
            documents.Run([
                documents.Text("Hello.")
            ])
        ])
    ]);
    var docxFile = createFakeDocxFile({
        "word/document.xml": testData("simple/word/document.xml")
    });
    return docxReader.read(docxFile).then(function(result) {
        assert.deepEqual(expectedDocument, result.value);
    });
});

test("hyperlink hrefs are read from relationships file", function() {
    var docxFile = createFakeDocxFile({
        "word/document.xml": testData("hyperlinks/word/document.xml"),
        "word/_rels/document.xml.rels": testData("hyperlinks/word/_rels/document.xml.rels")
    });
    return docxReader.read(docxFile).then(function(result) {
        var paragraph = result.value.children[0];
        assert.equal(1, paragraph.children.length);
        var hyperlink = paragraph.children[0];
        assert.equal(hyperlink.href, "http://www.example.com");
        assert.equal(hyperlink.children.length, 1);
    });
});
