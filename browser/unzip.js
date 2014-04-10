var JSZip = require("jszip");

var promises = require("../lib/promises");

exports.openZip = openZip;

function openZip(options) {
    if (options.arrayBuffer) {
        return openArrayBuffer(options.arrayBuffer);
    } else {
        return promises.reject(new Error("Could not find file in options"));
    }
}

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
    return {
        exists: exists,
        read: read
    };
}
