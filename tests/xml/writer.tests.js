var assert = require("assert");

var Element = require("../../lib/xml").Element;
var writer = require("../../lib/xml/writer");
var test = require("../testing").test;


describe('xml.writer', function() {
    test('writing empty root element writes out xml declaration and empty root element', function() {
        assert.equal(writer.writeString(new Element("root")),
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<root/>');
    });
});

