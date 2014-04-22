var assert = require("assert");

var duck = require("duck");

var readStylesXml = require("../../lib/docx/styles-reader").readStylesXml;
var XmlElement = require("../../lib/xmlreader").Element;
var test = require("../testing").test;


describe('readStylesXml', function() {
    test('paragraph style is null if no style with that ID exists', function() {
        var styles = readStylesXml({
            root: new XmlElement("w:styles", {}, [])
        });
        assert.equal(styles.findParagraphStyleById("Heading1"), null);
    });
    
    test('paragraph style can be found by ID', function() {
        var styles = readStylesXml({
            root: new XmlElement("w:styles", {}, [
                new XmlElement("w:style", {"w:styleId": "Heading1"}, [
                    new XmlElement("w:name", {"w:val": "Heading 1"}, [])
                ])
            ])
        });
        assert.equal(styles.findParagraphStyleById("Heading1").styleId, "Heading1");
    });
});
