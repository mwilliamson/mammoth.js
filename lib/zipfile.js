var JSZip = require("jszip");

var promises = require("./promises");

exports.openArrayBuffer = openArrayBuffer;
exports.uriToZipEntryName = uriToZipEntryName;

function openArrayBuffer(arrayBuffer) {
    var zipFile = new JSZip(arrayBuffer);
    function exists(name) {
        return zipFile.file(name) !== null;
    }
    
    function read(name, encoding) {
        var array = zipFile.file(name).asUint8Array();
        var buffer = new Buffer(array);
        if (encoding) {
            return promises.when(buffer.toString(encoding));
        } else {
            return promises.when(buffer);
        }
    }
    
    function write(name, contents) {
        zipFile.file(name, contents);
    }
    
    function toBuffer() {
        return zipFile.generate({type: "nodebuffer"});
    }
    
    return {
        exists: exists,
        read: read,
        write: write,
        toBuffer: toBuffer
    };
}

function uriToZipEntryName(base, uri) {
    if (uri.charAt(0) === "/") {
        return uri.substr(1);
    } else {
        // In general, we should check first and second for trailing and leading slashes,
        // but in our specific case this seems to be sufficient
        return base + "/" + uri;
    }
}
