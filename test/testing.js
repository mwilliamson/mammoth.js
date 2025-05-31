var path = require("path");
var fs = require("fs");
var promises = require("../lib/promises");
var _ = require("underscore");

exports.testPath = testPath;
exports.testData = testData;
exports.createFakeDocxFile = createFakeDocxFile;
exports.createFakeFiles = createFakeFiles;


function testPath(filename) {
    return path.join(__dirname, "test-data", filename);
}

function testData(testDataPath) {
    var fullPath = testPath(testDataPath);
    return promises.nfcall(fs.readFile, fullPath, "utf-8");
}

function createFakeDocxFile(files) {
    function exists(path) {
        return !!files[path];
    }

    return {
        read: createRead(files),
        exists: exists
    };
}

function createFakeFiles(files) {
    return {
        read: createRead(files)
    };
}

function createRead(files) {
    function read(path, encoding) {
        return Promise.resolve(files[path], function(buffer) {
            if (_.isString(buffer)) {
                buffer = new Buffer(buffer);
            }

            if (!Buffer.isBuffer(buffer)) {
                return Promise.reject(new Error("file was not a buffer"));
            } else if (encoding) {
                return Promise.resolve(buffer.toString(encoding));
            } else {
                return Promise.resolve(buffer.buffer);
            }
        });
    }
    return read;
}
