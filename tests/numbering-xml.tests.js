var assert = require("assert");

var readNumberingXml = require("../lib/numbering-xml").readNumberingXml;
var XmlElement = require("../lib/xmlreader").Element;
var test = require("./testing").test;


describe('readNumberingXml', function() {
    test('reads no numbering elements from empty XML', function() {
        var numbering = readNumberingXml({
            root: new XmlElement("w:numbering")
        });
        assert.deepEqual(numbering, []);
    });
});
