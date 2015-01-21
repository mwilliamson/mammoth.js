var assert = require("assert");

var readFootnotesXml = require("../../lib/docx/notes-reader").readFootnotesXml;
var XmlElement = require("../../lib/xmlreader").Element;
var test = require("../testing").test;


describe('readFootnotesXml', function() {
    test('ID and body of footnote are read', function() {
        var footnoteBody = [new XmlElement("w:p", {}, [])];
        var footnotes = readFootnotesXml({
            root: new XmlElement("w:footnotes", {}, [
                new XmlElement("w:footnote", {"w:id": "1"}, footnoteBody)
            ])
        });
        assert.equal(footnotes.length, 1);
        assert.strictEqual(footnotes[0].body, footnoteBody);
        assert.deepEqual(footnotes[0].id, "1");
    });
});

footnoteTypeIsIgnored('continuationSeparator');
footnoteTypeIsIgnored('separator');

function footnoteTypeIsIgnored(type) {
    describe('footnotes of type ' + type + ' are ignored', function() {
        test('ID and body of footnote are read', function() {
            var footnotes = readFootnotesXml({
                root: new XmlElement("w:footnotes", {}, [
                    new XmlElement("w:footnote", {"w:id": "1", "w:type": type}, [])
                ])
            });
            assert.equal(footnotes.length, 0);
        });
    });
}
