var assert = require("assert");

var JSZip = require("jszip");

var zipfile = require("../../lib/zipfile");
var styleMap = require("../../lib/docx/style-map");
var test = require("../testing").test;

describe("zipfile", function() {
    test('embedded style map can be read after being written', function() {
        var zip = emptyZipFile();
        
        styleMap.writeStyleMap(zip, "p => h1");
        
        return styleMap.readStyleMap(zip).then(function(contents) {
            assert.equal(contents, "p => h1");
        });
    });
});

function emptyZipFile() {
    var zip = new JSZip();
    var buffer = zip.generate({type: "arraybuffer"});
    return zipfile.openArrayBuffer(buffer);
}

