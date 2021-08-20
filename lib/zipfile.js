var JSZip = require("jszip");

var promises = require("./promises");

exports.openArrayBuffer = openArrayBuffer;
exports.splitPath = splitPath;
exports.joinPath = joinPath;

async function openArrayBuffer(arrayBuffer) {
    var zipFile = await new JSZip().loadAsync(arrayBuffer);
    function exists(name) {
        return zipFile.file(name) !== null;
    }

    async function read(name, encoding) {
        var array = await zipFile.file(name).async("uint8array");
        var buffer = uint8ArrayToBuffer(array);
        if (encoding) {
            return promises.when(buffer.toString(encoding));
        } else {
            return promises.when(buffer);
        }
    }

    function write(name, contents) {
        zipFile.file(name, contents);
    }

    async function toBuffer() {
        return await zipFile.generateAsync({type: "nodebuffer"});
    }

    return {
        exists: exists,
        read: read,
        write: write,
        toBuffer: toBuffer
    };
}

function uint8ArrayToBuffer(array) {
    if (Buffer.from && Buffer.from !== Uint8Array.from) {
        return Buffer.from(array);
    } else {
        return new Buffer(array);
    }
}

function splitPath(path) {
    var lastIndex = path.lastIndexOf("/");
    if (lastIndex === -1) {
        return {dirname: "", basename: path};
    } else {
        return {
            dirname: path.substring(0, lastIndex),
            basename: path.substring(lastIndex + 1)
        };
    }
}

function joinPath() {
    var nonEmptyPaths = Array.prototype.filter.call(arguments, function(path) {
        return path;
    });

    var relevantPaths = [];

    nonEmptyPaths.forEach(function(path) {
        if (/^\//.test(path)) {
            relevantPaths = [path];
        } else {
            relevantPaths.push(path);
        }
    });

    return relevantPaths.join("/");
}
