var assert = require("assert");

var DocumentXmlReader = require("../lib/document-xml-reader").DocumentXmlReader;
var documents = require("../lib/documents");
var XmlElement = require("../lib/xmlreader").Element;

var testing = require("./testing");
var test = testing.test;
var createFakeDocxFile = testing.createFakeDocxFile;

function readXmlElement(element) {
    return new DocumentXmlReader({}).readXmlElement(element);
}

function readXmlElementValue(element) {
    var result = readXmlElement(element);
    assert.deepEqual(result.messages, []);
    return result.value;
}

describe("readXmlElement: ", function() {
    test("paragraph has no style if it has no properties", function() {
        var paragraphXml = new XmlElement("w:p", {}, []);
        var paragraph = readXmlElementValue(paragraphXml);
        assert.deepEqual(paragraph.styleName, null);
    });
    
    test("paragraph has style name read from paragraph properties if present", function() {
        var styleXml = new XmlElement("w:pStyle", {"w:val": "Heading1"}, []);
        var propertiesXml = new XmlElement("w:pPr", {}, [styleXml]);
        var paragraphXml = new XmlElement("w:p", {}, [propertiesXml]);
        var paragraph = readXmlElementValue(paragraphXml);
        assert.deepEqual(paragraph.styleName, "Heading1");
    });
    
    test("run has no style if it has no properties", function() {
        var runXml = runWithProperties([]);
        var run = readXmlElementValue(runXml);
        assert.deepEqual(run.styleName, null);
    });
    
    test("run has style name read from run properties if present", function() {
        var runStyleXml = new XmlElement("w:rStyle", {"w:val": "Emphasis"});
        var runXml = runWithProperties([runStyleXml]);
        var run = readXmlElementValue(runXml);
        assert.deepEqual(run.styleName, "Emphasis");
    });
    
    test("isBold is false if bold element is not present", function() {
        var runXml = runWithProperties([]);
        var run = readXmlElementValue(runXml);
        assert.deepEqual(run.isBold, false);
    });
    
    test("isBold is true if bold element is present", function() {
        var boldXml = new XmlElement("w:b");
        var runXml = runWithProperties([boldXml]);
        var run = readXmlElementValue(runXml);
        assert.equal(run.isBold, true);
    });
    
    test("isItalic is false if bold element is not present", function() {
        var runXml = runWithProperties([]);
        var run = readXmlElementValue(runXml);
        assert.deepEqual(run.isItalic, false);
    });
    
    test("isItalic is true if bold element is present", function() {
        var italicXml = new XmlElement("w:i");
        var runXml = runWithProperties([italicXml]);
        var run = readXmlElementValue(runXml);
        assert.equal(run.isItalic, true);
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
        var reader = new DocumentXmlReader(
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

function runWithProperties(children) {
    return new XmlElement("w:r", {}, [createRunPropertiesXml(children)]);
}

function createRunPropertiesXml(children) {
    return new XmlElement("w:rPr", {}, children);
}
