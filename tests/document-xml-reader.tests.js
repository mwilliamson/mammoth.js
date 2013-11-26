var assert = require("assert");

var DocumentXmlReader = require("../lib/document-xml-reader").DocumentXmlReader;
var documents = require("../lib/documents");
var XmlElement = require("../lib/xmlreader").Element;
var Numbering = require("../lib/numbering-xml").Numbering;

var testing = require("./testing");
var test = testing.test;
var createFakeDocxFile = testing.createFakeDocxFile;

function readXmlElement(element, options) {
    options = options || {}
    return new DocumentXmlReader(options.relationships || {}).readXmlElement(element);
}

function readXmlElementValue(element) {
    var result = readXmlElement(element);
    assert.deepEqual(result.messages, []);
    return result.value;
}

var fakeContentTypes = {
    findContentType: function(path) {
        return "<content-type: " + path + ">";
    }
};

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
    
    test("paragraph has numbering properties from paragraph properties if present", function() {
        var numberingPropertiesXml = new XmlElement("w:numPr", {}, [
            new XmlElement("w:ilvl", {"w:val": "1"}),
            new XmlElement("w:numId", {"w:val": "42"})
        ]);
        var propertiesXml = new XmlElement("w:pPr", {}, [numberingPropertiesXml]);
        var paragraphXml = new XmlElement("w:p", {}, [propertiesXml]);
        
        var numbering = new Numbering({"42": {"1": {isOrdered: true, level: "1"}}});
        
        var reader = new DocumentXmlReader(
            {},
            null,
            null,
            numbering
        );
        var paragraph = reader.readXmlElement(paragraphXml).value;
        assert.deepEqual(paragraph.numbering, {level: "1", isOrdered: true});
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
    
    test("w:tab is read as document tab element", function() {
        var tabXml = new XmlElement("w:tab");
        var result = readXmlElement(tabXml);
        assert.deepEqual(result.value, new documents.Tab());
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
        assert.deepEqual([], result.value);
    });
    
    test("can read inline pictures", function() {
        var drawing = createInlineImage({
            relationshipId: "rId5",
            description: "It's a hat"
        });
        
        var imageBuffer = new Buffer("Not an image at all!");
        var reader = new DocumentXmlReader(
            {
                "rId5": {target: "media/hat.png"}
            },
            fakeContentTypes,
            createFakeDocxFile({
                "word/media/hat.png": imageBuffer
            })
        );
        var result = reader.readXmlElement(drawing);
        assert.deepEqual(result.messages, []);
        var element = single(result.value);
        assert.equal("image", element.type);
        assert.equal(element.altText, "It's a hat");
        assert.equal(element.contentType, "<content-type: word/media/hat.png>");
        return element.read()
            .then(function(readValue) {
                assert.equal(readValue, imageBuffer);
            });
    });
    
    test("can read anchored pictures", function() {
        var drawing = new XmlElement("w:drawing", {}, [
            new XmlElement("wp:anchor", {}, [
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
            fakeContentTypes,
            createFakeDocxFile({
                "word/media/hat.png": imageBuffer
            })
        );
        var result = reader.readXmlElement(drawing);
        assert.deepEqual(result.messages, []);
        var element = single(result.value);
        assert.equal("image", element.type);
        assert.equal(element.altText, "It's a hat");
        return element.read()
            .then(function(readValue) {
                assert.equal(readValue, imageBuffer)
            });
    });
    
    test("no elements created if image cannot be found in w:drawing", function() {
        var drawing = new XmlElement("w:drawing", {}, []);
        
        var reader = new DocumentXmlReader();
        var result = reader.readXmlElement(drawing);
        assert.deepEqual(result.messages, []);
        assert.deepEqual(result.value, []);
    });
    
    test("no elements created if image cannot be found in wp:inline", function() {
        var drawing = new XmlElement("wp:inline", {}, []);
        
        var reader = new DocumentXmlReader();
        var result = reader.readXmlElement(drawing);
        assert.deepEqual(result.messages, []);
        assert.deepEqual(result.value, []);
    });
    
    test("children of w:ins are converted normally", function() {
        var runXml = new XmlElement("w:r", {}, []);
        var insXml = new XmlElement("w:ins", {}, [runXml]);
        var result = readXmlElement(insXml);
        assert.deepEqual(result.value[0].type, "run");
    });
    
    test("w:hyperlink is read as document hyperlink if it has a relationship ID", function() {
        var runXml = new XmlElement("w:r", {}, []);
        var hyperlinkXml = new XmlElement("w:hyperlink", {"r:id": "r42"}, [runXml]);
        var relationships = {
            "r42": {target: "http://example.com"}
        };
        var result = readXmlElement(hyperlinkXml, {relationships: relationships});
        assert.deepEqual(result.value.href, "http://example.com");
        assert.deepEqual(result.value.children[0].type, "run");
    });
    
    test("w:hyperlink is ignored if it does not have a relationship ID", function() {
        var runXml = new XmlElement("w:r", {}, []);
        var hyperlinkXml = new XmlElement("w:hyperlink", {}, [runXml]);
        var result = readXmlElement(hyperlinkXml);
        assert.deepEqual(result.value[0].type, "run");
    });
});

function runWithProperties(children) {
    return new XmlElement("w:r", {}, [createRunPropertiesXml(children)]);
}

function createRunPropertiesXml(children) {
    return new XmlElement("w:rPr", {}, children);
}

function single(array) {
    if (array.length === 1) {
        return array[0];
    } else {
        throw new Error("Array has " + array.length + " elements");
    }
}

function createInlineImage(options) {
    return new XmlElement("w:drawing", {}, [
        new XmlElement("wp:inline", {}, [
            new XmlElement("wp:docPr", {descr: options.description}),
            new XmlElement("a:graphic", {}, [
                new XmlElement("a:graphicData", {}, [
                    new XmlElement("pic:pic", {}, [
                        new XmlElement("pic:blipFill", {}, [
                            new XmlElement("a:blip", {"r:embed": options.relationshipId})
                        ])
                    ])
                ])
            ])
        ])
    ]);
}
