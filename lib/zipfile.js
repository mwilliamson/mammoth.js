var JSZip = require("jszip");

var promises = require("./promises");

exports.openArrayBuffer = openArrayBuffer;
exports.joinZipPath = joinZipPath;

function openArrayBuffer(arrayBuffer) {
    var zipFile = new JSZip(arrayBuffer);
    function exists(name) {
        return zipFile.file(normaliseName(name)) !== null;
    }
    
    function read(name, encoding) {
        var array = zipFile.file(normaliseName(name)).asUint8Array();
        var buffer = new Buffer(array);
        if (encoding) {
            return promises.when(buffer.toString(encoding));
        } else {
            return promises.when(buffer);
        }
    }
    
    function write(name, contents) {
        zipFile.file(normaliseName(name), contents);
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

function normaliseName(name) {
    if (name.charAt(0) === "/") {
        return name.substr(1);
    } else {
        return name;
    }
}

function joinZipPath(first, second) {
    if (second.charAt(0) === "/") {
        return second;
    } else {
        // In general, we should check first and second for trailing and leading slashes,
        // but in our specific case this seems to be sufficient
        return first + "/" + second;
    }
}
