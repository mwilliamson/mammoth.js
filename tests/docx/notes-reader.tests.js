var assert = require("assert");

var createFootnotesReader = require("../../lib/docx/notes-reader").createFootnotesReader;
var BodyReader = require("../../lib/docx/body-reader").BodyReader;
var documents = require("../../lib/documents");
var XmlElement = require("../../lib/xmlreader").Element;
var test = require("../testing").test;


describe('readFootnotesXml', function() {
    test('ID and body of footnote are read', function() {
        var bodyReader = new BodyReader({});
        var footnoteBody = [new XmlElement("w:p", {}, [])];
        var footnotes = createFootnotesReader(bodyReader)({
            root: new XmlElement("w:footnotes", {}, [
                new XmlElement("w:footnote", {"w:id": "1"}, footnoteBody)
            ])
        });
        assert.equal(footnotes.value.length, 1);
        assert.deepEqual(footnotes.value[0].body, [new documents.Paragraph([])]);
        assert.deepEqual(footnotes.value[0].noteId, "1");
    });
});

footnoteTypeIsIgnored('continuationSeparator');
footnoteTypeIsIgnored('separator');

function footnoteTypeIsIgnored(type) {
    describe('footnotes of type ' + type + ' are ignored', function() {
        test('ID and body of footnote are read', function() {
            var footnotes = createFootnotesReader()({
                root: new XmlElement("w:footnotes", {}, [
                    new XmlElement("w:footnote", {"w:id": "1", "w:type": type}, [])
                ])
            });
            assert.equal(footnotes.value.length, 0);
        });
    });
}
