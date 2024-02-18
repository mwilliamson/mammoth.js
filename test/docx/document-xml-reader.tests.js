var assert = require("assert");

var documents = require("../../lib/documents");
var DocumentXmlReader = require("../../lib/docx/document-xml-reader").DocumentXmlReader;
var xml = require("../../lib/xml");
var test = require("../test")(module);
var createBodyReaderForTests = require("./testing").createBodyReaderForTests;

test("when body element is present then body is read", function() {
    var bodyReader = createBodyReaderForTests({});
    var documentXmlReader = new DocumentXmlReader({
        bodyReader: bodyReader
    });
    var paragraphXml = xml.element("w:p", {}, []);
    var bodyXml = xml.element("w:body", {}, [paragraphXml]);
    var documentXml = xml.element("w:document", {}, [bodyXml]);

    var result = documentXmlReader.convertXmlToDocument(documentXml);

    assert.deepEqual(result.messages, []);
    assert.deepEqual(result.value, documents.document(
        [documents.paragraph([])],
        {}
    ));
});
