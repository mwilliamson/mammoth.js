var assert = require("assert");

var BodyReader = require("../../lib/docx/body-reader").BodyReader;
var DocumentXmlReader = require("../../lib/docx/document-xml-reader").DocumentXmlReader;
var XmlElement = require("../../lib/xmlreader").Element;

var testing = require("../testing");
var test = testing.test;

function convertXmlToDocumentValue(element, options) {
    var reader = new DocumentXmlReader(options);
    var result = reader.convertXmlToDocument(element);
    assert.deepEqual(result.messages, []);
    return result.value;
}

describe("convertXmlToDocument: ", function() {
    
    test("notes of document are read", function() {
        var paragraphXml = new XmlElement("w:p", {}, []);
        var footnotes = [{noteType: "footnote", id: "4", body: [paragraphXml]}];
        
        var bodyXml = new XmlElement("w:body", {}, []);
        var documentXml = new XmlElement("w:document", {}, [bodyXml]);
        
        var document = convertXmlToDocumentValue({root: documentXml}, {
            footnotes: footnotes,
            bodyReader: new BodyReader({})
        });
        var footnote = document.notes.resolve({noteType: "footnote", noteId: "4"});
        assert.deepEqual(footnote.noteId, "4");
        assert.deepEqual(footnote.body[0].type, "paragraph");
    });
});
