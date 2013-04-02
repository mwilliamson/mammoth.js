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
            assert.deepEqual(expectedDocument, result.document);
        });
    });
    
    test("can read paragraph styles", function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("paragraphStyles/word/document.xml")
        });
        return docxReader.read(docxFile).then(function(result) {
            var paragraph = result.document.children[0];
            assert.deepEqual("Heading1", paragraph.properties.styleName);
        });
    });
    
    test("hyperlink hrefs are read from relationships file", function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("hyperlinks/word/document.xml"),
            "word/_rels/document.xml.rels": testData("hyperlinks/word/_rels/document.xml.rels")
        });
        return docxReader.read(docxFile).then(function(result) {
            var paragraph = result.document.children[0];
            assert.equal(1, paragraph.children.length);
            var hyperlink = paragraph.children[0];
            assert.equal(hyperlink.href, "http://www.example.com");
            assert.equal(hyperlink.children.length, 1);
        });
    });
});

function readXmlElement(element) {
    return new docxReader.DocumentReader({}).readXmlElement(element);
}

describe("readElement", function() {
    test("reads styles from run properties", function() {
        var runStyleXml = new XmlElement("w:rStyle", {"w:val": "Emphasis"});
        var runPropertiesXml = createRunPropertiesXml([runStyleXml]);
        var result = readXmlElement(runPropertiesXml);
        assert.equal(result.value.styleName, "Emphasis");
    });
    
    test("isBold is false if bold element is not present", function() {
        var runPropertiesXml = createRunPropertiesXml([]);
        var result = readXmlElement(runPropertiesXml);
        assert.equal(result.value.isBold, false);
    });
    
    test("isBold is true if bold element is present", function() {
        var boldXml = new XmlElement("w:b");
        var runPropertiesXml = createRunPropertiesXml([boldXml]);
        var result = readXmlElement(runPropertiesXml);
        assert.equal(result.value.isBold, true);
    });
    
    test("isItalic is false if bold element is not present", function() {
        var runPropertiesXml = createRunPropertiesXml([]);
        var result = readXmlElement(runPropertiesXml);
        assert.equal(result.value.isItalic, false);
    });
    
    test("isItalic is true if bold element is present", function() {
        var italicXml = new XmlElement("w:i");
        var runPropertiesXml = createRunPropertiesXml([italicXml]);
        var result = readXmlElement(runPropertiesXml);
        assert.equal(result.value.isItalic, true);
    });
    
    test("run properties are attached to run", function() {
        var runStyleXml = new XmlElement("w:rStyle", {"w:val": "Emphasis"});
        var runPropertiesXml = new XmlElement("w:rPr", {}, [runStyleXml]);
        var runXml = new XmlElement("w:r", {}, [runPropertiesXml]);
        var result = readXmlElement(runXml);
        assert.equal(result.value.properties.styleName, "Emphasis");
    });
    
    test("run properties not included as child of run", function() {
        var runStyleXml = new XmlElement("w:rStyle", {"w:val": "Emphasis"});
        var runPropertiesXml = new XmlElement("w:rPr", {}, [runStyleXml]);
        var runXml = new XmlElement("w:r", {}, [runPropertiesXml]);
        var result = readXmlElement(runXml);
        assert.deepEqual(result.value.children, []);
    });
    
    test("emits warning on unrecognised element", function() {
        var unrecognisedElement = new XmlElement("w:not-an-element");
        var result = readXmlElement(unrecognisedElement);
        assert.deepEqual(
            result.messages,
            [{
                type: "warning",
                message: "An unrecognised element was ignored: w:not-an-element"
            }]
        );
    });
    
    test("w:bookmarkStart is ignored without warning", function() {
        var ignoredElement = new XmlElement("w:bookmarkStart");
        var result = readXmlElement(ignoredElement);
        assert.deepEqual(result.messages, []);
        assert.equal(null, result.value);
    });
    
    test("can read inline pictures", function() {
        var drawing = new XmlElement("w:drawing", {}, [
            new XmlElement("wp:inline", {}, [
                new XmlElement("wp:docPr", {descr: "It's a hat"}),
                new XmlElement("a:graphic", {}, [
                    new XmlElement("a:graphicData", {}, [
                        new XmlElement("pic:pic", {}, [
                            new XmlElement("pic:blipFill", {}, [
                                new XmlElement("a:blip", {"r:embed": "rId5"})
                            ])
                        ])
                    ])
                ])
            ])
        ]);
        
        var imageBuffer = new Buffer("Not an image at all!");
        var reader = new docxReader.DocumentReader(
            {
                "rId5": {target: "media/hat.png"}
            },
            createFakeDocxFile({
                "word/media/hat.png": imageBuffer
            })
        );
        var result = reader.readXmlElement(drawing);
        assert.deepEqual(result.messages, []);
        assert.equal("image", result.value.type);
        assert.equal(result.value.altText, "It's a hat");
        return result.value.read()
            .then(function(readValue) {
                assert.equal(readValue, imageBuffer)
            });
    });
});

function createRunPropertiesXml(children) {
    return new XmlElement("w:rPr", {}, children);
}
