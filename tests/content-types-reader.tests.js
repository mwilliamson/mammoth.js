var assert = require("assert");

var readContentTypesFromXml = require("../lib/content-types-reader").readContentTypesFromXml;
var XmlElement = require("../lib/xmlreader").Element;
var test = require("./testing").test;


describe('readContentTypesFromXml', function() {
    test('reads default-per-extension from XML', function() {
        var contentTypes = readContentTypesFromXml({
            root: new XmlElement("content-types:Types", {}, [
                new XmlElement("content-types:Default", {Extension: "png", ContentType: "image/png"})
            ])
        });
        assert.equal(contentTypes.findContentType("word/media/hat.png"), "image/png");
    });
    
    test('reads overrides in preference to defaults', function() {
        var contentTypes = readContentTypesFromXml({
            root: new XmlElement("content-types:Types", {}, [
                new XmlElement("content-types:Default", {Extension: "png", ContentType: "image/png"}),
                new XmlElement("content-types:Override", {PartName: "/word/media/hat.png", ContentType: "image/hat"})
            ])
        });
        assert.equal(contentTypes.findContentType("word/media/hat.png"), "image/hat");
    });
});
