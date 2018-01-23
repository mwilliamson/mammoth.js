var assert = require("assert");

var docxReader = require("../../lib/docx/docx-reader");
var documents = require("../../lib/documents");
var xml = require("../../lib/xml");

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

var relationshipNamespaces = {
    "r": "http://schemas.openxmlformats.org/package/2006/relationships"
};

test("main document is found using _rels/.rels", function() {
    var relationships = xml.element("r:Relationships", {}, [
        xml.element("r:Relationship", {
            "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
            "Target": "/word/document2.xml"
        })
    ]);
    
    var docxFile = createFakeDocxFile({
        "word/document2.xml": testData("simple/word/document.xml"),
        "_rels/.rels": xml.writeString(relationships, relationshipNamespaces)
    });
    var expectedDocument = documents.Document([
        documents.Paragraph([
            documents.Run([
                documents.Text("Hello.")
            ])
        ])
    ]);
    return docxReader.read(docxFile).then(function(result) {
        assert.deepEqual(expectedDocument, result.value);
    });
});


test("error is thrown when main document part does not exist", function() {
    var relationships = xml.element("r:Relationships", {}, [
        xml.element("r:Relationship", {
            "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
            "Target": "/word/document2.xml"
        })
    ]);
    
    var docxFile = createFakeDocxFile({
        "_rels/.rels": xml.writeString(relationships, relationshipNamespaces)
    });
    return docxReader.read(docxFile).then(function(result) {
        assert.ok(false, "Expected error");
    }, function(error) {
        assert.equal(error.message, "Could not find main document part. Are you sure this is a valid .docx file?");
    });
});
