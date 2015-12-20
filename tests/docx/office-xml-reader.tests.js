var assert = require("assert");

var xml = require("../../lib/xml");
var officeXmlReader = require("../../lib/docx/office-xml-reader");
var test = require("../testing").test;


describe("office-xml-reader", function() {
    test("mc:AlternateContent is replaced by contents of mc:Fallback", function() {
        var xmlString =
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<numbering xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">' +
            '<mc:AlternateContent>' +
            '<mc:Choice Requires="w14">' +
            '<choice/>' +
            '</mc:Choice>' +
            '<mc:Fallback>' +
            '<fallback/>' +
            '</mc:Fallback>' +
            '</mc:AlternateContent>' +
            '</numbering>';
        return officeXmlReader.read(xmlString).then(function(element) {
            assert.deepEqual(element.root.children, [xml.element("fallback")]);
        });
    });
});
