var assert = require("assert");

var xml = require("../../lib/xml");
var writer = require("../../lib/xml/writer");
var test = require("../testing").test;


describe('xml.writer', function() {
    test('writing empty root element writes out xml declaration and empty root element', function() {
        assertXmlString(xml.element("root"), '<root/>');
    });
    
    test('can write empty child elements', function() {
        assertXmlString(xml.element("root", {}, [xml.element("album"), xml.element("single")]),
            '<root><album/><single/></root>');
    });
    
    test('can write empty descendant elements', function() {
        var element = xml.element("root", {}, [
            xml.element("album", {}, [
                xml.element("year"),
                xml.element("song")
            ])
        ]);
        assertXmlString(element,
            '<root><album><year/><song/></album></root>');
    });
    
    test('can write text nodes', function() {
        var element = xml.element("root", {}, [
            xml.element("album", {}, [
                xml.text("Everything in Transit")
            ])
        ]);
        assertXmlString(element,
            '<root><album>Everything in Transit</album></root>');
    });
});


function assertXmlString(element, expectedString) {
    assert.equal(writer.writeString(element),
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        expectedString);
}
