var assert = require("assert");

var JSZip = require("jszip");

var zipfile = require("../../lib/zipfile");
var styleMap = require("../../lib/docx/style-map");
var test = require("../testing").test;

describe("zipfile", function() {
    test('embedded style map can be read after being written', function() {
        var zip = normalDocx();
        
        return styleMap.writeStyleMap(zip, "p => h1").then(function() {
            return styleMap.readStyleMap(zip).then(function(contents) {
                assert.equal(contents, "p => h1");
            });
        });
    });
    
    test('embedded style map is written to separate file', function() {
        var zip = normalDocx();
        
        return styleMap.writeStyleMap(zip, "p => h1").then(function() {
            return zip.read("mammoth/style-map", "utf8").then(function(contents) {
                assert.equal(contents, "p => h1");
            });
        });
    });
    
    test('embedded style map is referenced in relationships', function() {
        var zip = normalDocx();
        
        var expectedRelationshipsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>' +
            '<Relationship Id="rMammothStyleMap" Type="http://schemas.zwobble.org/mammoth/style-map" Target="/mammoth/style-map"/>' +
            '</Relationships>';
        
        return styleMap.writeStyleMap(zip, "p => h1").then(function() {
            return zip.read("word/_rels/document.xml.rels", "utf8").then(function(contents) {
                assert.equal(contents, expectedRelationshipsXml);
            });
        });
    });
});

function normalDocx() {
    var zip = new JSZip();
    var originalRelationshipsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>' +
        '</Relationships>';
    zip.file("word/_rels/document.xml.rels", originalRelationshipsXml);
    var buffer = zip.generate({type: "arraybuffer"});
    return zipfile.openArrayBuffer(buffer);
}

