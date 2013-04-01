var assert = require("assert");

var docxReader = require("../lib/docx-reader");
var documents = require("../lib/documents");
var XmlElement = require("../lib/xmlreader").Element;

var testing = require("./testing");
var test = testing.test;
var testData = testing.testData;
var createFakeDocxFile = testing.createFakeDocxFile;


describe("docx-reader", function() {
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
            assert.deepEqual(expectedDocument, result);
        });
    });
    
    test("can read paragraph styles", function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("paragraphStyles/word/document.xml")
        });
        return docxReader.read(docxFile).then(function(result) {
            var paragraph = result.children[0];
            assert.deepEqual("Heading1", paragraph.properties.styleName);
        });
    });
    
    test("paragraph properties are not included as child of paragraph", function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("paragraphStyles/word/document.xml")
        });
        return docxReader.read(docxFile).then(function(result) {
            var paragraph = result.children[0];
            assert.equal(1, paragraph.children.length);
        });
    });
});

describe("readElement", function() {
    test("reads styles from run properties", function() {
        var runStyleXml = new XmlElement("w:rStyle", {"w:val": "Emphasis"});
        var runPropertiesXml = new XmlElement("w:rPr", {}, [runStyleXml]);
        var element = docxReader.readXmlElement(runPropertiesXml);
        assert.equal(element.styleName, "Emphasis");
    });
});
