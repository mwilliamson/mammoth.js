var q = require("q");

exports.openZip = openZip;

function openZip(options) {
    if (options.arrayBuffer) {
        return openArrayBuffer(options.arrayBuffer);
    } else {
        return q.reject(new Error("Could not find file in options"));
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
            return q.when(buffer.toString(encoding));
        } else {
            return q.when(buffer);
        }
    }
    return {
        exists: exists,
        read: read
    };
}
