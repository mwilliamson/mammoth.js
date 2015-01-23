var assert = require("assert");
var path = require("path");

var DocumentXmlReader = require("../../lib/docx/document-xml-reader").DocumentXmlReader;
var documents = require("../../lib/documents");
var XmlElement = require("../../lib/xmlreader").Element;
var Numbering = require("../../lib/docx/numbering-xml").Numbering;
var Styles = require("../../lib/docx/styles-reader").Styles;
var warning = require("../../lib/results").warning;

var testing = require("../testing");
var test = testing.test;
var createFakeDocxFile = testing.createFakeDocxFile;

function readXmlElement(element, options) {
    options = options || {};
    return new DocumentXmlReader(options).readXmlElement(element);
}

function readXmlElementValue(element, options) {
    var result = readXmlElement(element, options);
    assert.deepEqual(result.messages, []);
    return result.value;
}

function convertXmlToDocumentValue(element, options) {
    options = options || {};
    var reader = new DocumentXmlReader(options);
    var result = reader.convertXmlToDocument(element, options);
    assert.deepEqual(result.messages, []);
    return result.value;
}

var fakeContentTypes = {
    findContentType: function(filePath) {
        var extensionTypes = {
            ".png": "image/png",
            ".emf": "image/x-emf"
        };
        return extensionTypes[path.extname(filePath)];
    }
};

describe("readXmlElement: ", function() {
    test("paragraph has no style if it has no properties", function() {
        var paragraphXml = new XmlElement("w:p", {}, []);
        var paragraph = readXmlElementValue(paragraphXml);
        assert.deepEqual(paragraph.styleId, null);
    });

    test("paragraph has style ID read from paragraph properties if present", function() {
        var styleXml = new XmlElement("w:pStyle", {"w:val": "Heading1"}, []);
        var propertiesXml = new XmlElement("w:pPr", {}, [styleXml]);
        var paragraphXml = new XmlElement("w:p", {}, [propertiesXml]);

        var styles = new Styles({"Heading1": {name: "Heading 1"}}, {});

        var paragraph = readXmlElementValue(paragraphXml, {styles: styles});
        assert.deepEqual(paragraph.styleId, "Heading1");
    });

    test("paragraph has style name read from paragraph properties and styles", function() {
        var styleXml = new XmlElement("w:pStyle", {"w:val": "Heading1"}, []);
        var propertiesXml = new XmlElement("w:pPr", {}, [styleXml]);
        var paragraphXml = new XmlElement("w:p", {}, [propertiesXml]);

        var styles = new Styles({"Heading1": {name: "Heading 1"}}, {});

        var paragraph = readXmlElementValue(paragraphXml, {styles: styles});
        assert.deepEqual(paragraph.styleName, "Heading 1");
    });

    test("paragraph has justification read from paragraph properties if present", function() {
        var justificationXml = new XmlElement("w:jc", {"w:val": "center"}, []);
        var propertiesXml = new XmlElement("w:pPr", {}, [justificationXml]);
        var paragraphXml = new XmlElement("w:p", {}, [propertiesXml]);
        var paragraph = readXmlElementValue(paragraphXml);
        assert.deepEqual(paragraph.alignment, "center");
    });

    test("paragraph has numbering properties from paragraph properties if present", function() {
        var numberingPropertiesXml = new XmlElement("w:numPr", {}, [
            new XmlElement("w:ilvl", {"w:val": "1"}),
            new XmlElement("w:numId", {"w:val": "42"})
        ]);
        var propertiesXml = new XmlElement("w:pPr", {}, [numberingPropertiesXml]);
        var paragraphXml = new XmlElement("w:p", {}, [propertiesXml]);

        var numbering = new Numbering({"42": {"1": {isOrdered: true, level: "1"}}});

        var reader = new DocumentXmlReader({
            numbering: numbering
        });
        var paragraph = reader.readXmlElement(paragraphXml).value;
        assert.deepEqual(paragraph.numbering, {level: "1", isOrdered: true});
    });

    test("run has no style if it has no properties", function() {
        var runXml = runWithProperties([]);
        var run = readXmlElementValue(runXml);
        assert.deepEqual(run.styleId, null);
    });

    test("run has style ID read from run properties if present", function() {
        var runStyleXml = new XmlElement("w:rStyle", {"w:val": "Heading1Char"});
        var runXml = runWithProperties([runStyleXml]);

        var styles = new Styles({}, {"Heading1Char": {name: "Heading 1 Char"}});

        var run = readXmlElementValue(runXml, {styles: styles});
        assert.deepEqual(run.styleId, "Heading1Char");
    });

    test("run has style name read from run properties and styles", function() {
        var runStyleXml = new XmlElement("w:rStyle", {"w:val": "Heading1Char"});
        var runXml = runWithProperties([runStyleXml]);

        var styles = new Styles({}, {"Heading1Char": {name: "Heading 1 Char"}});

        var run = readXmlElementValue(runXml, {styles: styles});
        assert.deepEqual(run.styleName, "Heading 1 Char");
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

    test("isUnderline is false if underline element is not present", function() {
        var runXml = runWithProperties([]);
        var run = readXmlElementValue(runXml);
        assert.deepEqual(run.isUnderline, false);
    });

    test("isUnderline is true if underline element is present", function() {
        var underlineXml = new XmlElement("w:u");
        var runXml = runWithProperties([underlineXml]);
        var run = readXmlElementValue(runXml);
        assert.equal(run.isUnderline, true);
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

    test("run has baseline vertical alignment by default", function() {
        var runXml = runWithProperties([]);
        var run = readXmlElementValue(runXml);
        assert.deepEqual(run.verticalAlignment, documents.verticalAlignment.baseline);
    });

    test("run has vertical alignment read from properties", function() {
        var verticalAlignmentXml = new XmlElement("w:vertAlign", {"w:val": "superscript"});
        var runXml = runWithProperties([verticalAlignmentXml]);

        var run = readXmlElementValue(runXml);
        assert.deepEqual(run.verticalAlignment, documents.verticalAlignment.superscript);
    });

    test("run properties not included as child of run", function() {
        var runStyleXml = new XmlElement("w:rStyle");
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

    test("w:table is read as document table element", function() {
        var tableXml = new XmlElement("w:tbl", {}, [
            new XmlElement("w:tr", {}, [
                new XmlElement("w:tc", {}, [
                    new XmlElement("w:p", {}, [])
                ])
            ])
        ]);
        var result = readXmlElement(tableXml);
        assert.deepEqual(result.value, new documents.Table([
            new documents.TableRow([
                new documents.TableCell([
                    new documents.Paragraph([])
                ])
            ])
        ]));
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
        var reader = new DocumentXmlReader({
            relationships: {
                "rId5": {target: "media/hat.png"}
            },
            contentTypes: fakeContentTypes,
            docxFile: createFakeDocxFile({
                "word/media/hat.png": imageBuffer
            })
        });
        var result = reader.readXmlElement(drawing);
        assert.deepEqual(result.messages, []);
        var element = single(result.value);
        assert.equal("image", element.type);
        assert.equal(element.altText, "It's a hat");
        assert.equal(element.contentType, "image/png");
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
        var reader = new DocumentXmlReader({
            relationships: {
                "rId5": {target: "media/hat.png"}
            },
            contentTypes: fakeContentTypes,
            docxFile: createFakeDocxFile({
                "word/media/hat.png": imageBuffer
            })
        });
        var result = reader.readXmlElement(drawing);
        assert.deepEqual(result.messages, []);
        var element = single(result.value);
        assert.equal("image", element.type);
        assert.equal(element.altText, "It's a hat");
        return element.read()
            .then(function(readValue) {
                assert.equal(readValue, imageBuffer);
            });
    });

    test("warning if unsupported image type", function() {
        var drawing = createInlineImage({
            relationshipId: "rId5",
            description: "It's a hat"
        });

        var imageBuffer = new Buffer("Not an image at all!");
        var reader = new DocumentXmlReader({
            relationships: {
                "rId5": {target: "media/hat.emf"}
            },
            contentTypes: fakeContentTypes,
            docxFile: createFakeDocxFile({
                "word/media/hat.emf": imageBuffer
            })
        });
        var result = reader.readXmlElement(drawing);
        assert.deepEqual(result.messages, [warning("Image of type image/x-emf is unlikely to display in web browsers")]);
        var element = single(result.value);
        assert.equal(element.contentType, "image/x-emf");
    });

    test("no elements created if image cannot be found in w:drawing", function() {
        var drawing = new XmlElement("w:drawing", {}, []);

        var reader = new DocumentXmlReader({});
        var result = reader.readXmlElement(drawing);
        assert.deepEqual(result.messages, []);
        assert.deepEqual(result.value, []);
    });

    test("no elements created if image cannot be found in wp:inline", function() {
        var drawing = new XmlElement("wp:inline", {}, []);

        var reader = new DocumentXmlReader({});
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

    test("children of w:smartTag are converted normally", function() {
        var runXml = new XmlElement("w:r", {}, []);
        var smartTagXml = new XmlElement("w:smartTag", {}, [runXml]);
        var result = readXmlElement(smartTagXml);
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

    test("w:hyperlink is read as document hyperlink if it has an anchor", function() {
        var runXml = new XmlElement("w:r", {}, []);
        var hyperlinkXml = new XmlElement("w:hyperlink", {"w:anchor": "_Peter"}, [runXml]);
        var result = readXmlElement(hyperlinkXml);
        assert.deepEqual(result.value.href, "#_Peter");
        assert.deepEqual(result.value.children[0].type, "run");
    });

    test("w:hyperlink is ignored if it does not have a relationship ID", function() {
        var runXml = new XmlElement("w:r", {}, []);
        var hyperlinkXml = new XmlElement("w:hyperlink", {}, [runXml]);
        var result = readXmlElement(hyperlinkXml);
        assert.deepEqual(result.value[0].type, "run");
    });

    test("w:br is read as line break", function() {
        var breakXml = new XmlElement("w:br", {}, []);
        var result = readXmlElement(breakXml);
        assert.deepEqual(result.value.type, "lineBreak");
        assert.deepEqual(result.messages, []);
    });

    test("warning on breaks that aren't line breaks", function() {
        var breakXml = new XmlElement("w:br", {"w:type": "page"}, []);
        var result = readXmlElement(breakXml);
        assert.deepEqual(result.value, []);
        assert.deepEqual(result.messages, [warning("Unsupported break type: page")]);
    });

});

describe("convertXmlToDocument: ", function() {

    test("notes of document are read", function() {
        var paragraphXml = new XmlElement("w:p", {}, []);
        var footnotes = [{noteType: "footnote", id: "4", body: [paragraphXml]}];

        var bodyXml = new XmlElement("w:body", {}, []);
        var documentXml = new XmlElement("w:document", {}, [bodyXml]);

        var document = convertXmlToDocumentValue({root: documentXml}, {footnotes: footnotes});
        var footnote = document.notes.resolve({noteType: "footnote", noteId: "4"});
        assert.deepEqual(footnote.noteId, "4");
        assert.deepEqual(footnote.body[0].type, "paragraph");
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
