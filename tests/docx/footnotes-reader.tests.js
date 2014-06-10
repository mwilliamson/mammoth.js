var assert = require("assert");

var duck = require("duck");

var readFootnotesXml = require("../../lib/docx/footnotes-reader").readFootnotesXml;
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
