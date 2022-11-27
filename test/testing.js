var path = require("path");
var fs = require("fs");
var util = require("util");
var _ = require("underscore");

exports.testPath = testPath;
exports.testData = testData;
exports.createFakeDocxFile = createFakeDocxFile;
exports.createFakeFiles = createFakeFiles;


function testPath(filename) {
    return path.join(__dirname, "test-data", filename);
}

var readFile = util.promisify(fs.readFile);

function testData(testDataPath) {
    var fullPath = testPath(testDataPath);

    return readFile(fullPath, "utf-8");
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
        return Promise.resolve(files[path]).then(function(buffer) {
            if (_.isString(buffer)) {
                buffer = new Buffer(buffer);
            }

            if (!Buffer.isBuffer(buffer)) {
                return Promise.reject(new Error("file was not a buffer"));
            } else if (encoding) {
                return buffer.toString(encoding);
            } else {
                return buffer;
            }
        });
    }
    return read;
}
