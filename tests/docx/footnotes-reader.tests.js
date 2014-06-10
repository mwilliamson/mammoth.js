var assert = require("assert");

var duck = require("duck");

var readFootnotesXml = require("../../lib/docx/footnotes-reader").readFootnotesXml;
var XmlElement = require("../../lib/xmlreader").Element;
var test = require("../testing").test;


describe('readFootnotesXml', function() {
    test('footnote can be looked up by ID', function() {
        var footnoteBody = [new XmlElement("w:p", {}, [])];
        var footnotes = readFootnotesXml({
            root: new XmlElement("w:footnotes", {}, [
                new XmlElement("w:footnote", {"w:id": "1"}, footnoteBody)
            ])
        });
        assert.strictEqual(footnotes.findFootnoteById("1").body, footnoteBody);
    });
    
    test('footnote is null if no footnote with that ID exists', function() {
        var footnoteBody = [new XmlElement("w:p", {}, [])];
        var footnotes = readFootnotesXml({
            root: new XmlElement("w:footnotes", {}, [
                new XmlElement("w:footnote", {"w:id": "1"}, footnoteBody)
            ])
        });
        assert.strictEqual(footnotes.findFootnoteById("2"), null);
    });
});
