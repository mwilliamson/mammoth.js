var assert = require("assert");

var JSZip = require("jszip");

var zipfile = require("../lib/zipfile");
var test = require("./test")(module);

test('file in zip can be read after being written', function() {
    var zip = emptyZipFile();
    assert(!zip.exists("song/title"));
    
    zip.write("song/title", "Dark Blue");
    
    assert(zip.exists("song/title"));
    return zip.read("song/title", "utf8").then(function(contents) {
        assert.equal(contents, "Dark Blue");
    });
});

function emptyZipFile() {
    var zip = new JSZip();
    var buffer = zip.generate({type: "arraybuffer"});
    return zipfile.openArrayBuffer(buffer);
}
