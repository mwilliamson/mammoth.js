var path = require("path");
var fs = require("fs");
var q = require("q");
var _ = require("underscore");

exports.test = test;
exports.testData = testData;
exports.createFakeDocxFile = createFakeDocxFile;


function test(name, func) {
    it(name, function(done) {
        var result = func();
        q.when(result).then(function() {
            done()
        }).done();
    });
}

function testData(testDataPath) {
    var fullPath = path.join(__dirname, "test-data", testDataPath);
    return q.nfcall(fs.readFile, fullPath, "utf-8");
}

function createFakeDocxFile(files) {
    function read(path, encoding) {
        return q.when(files[path], function(buffer) {
            if (_.isString(buffer)) {
                buffer = new Buffer(buffer);
            }
            
            if (!Buffer.isBuffer(buffer)) {
                return q.reject(new Error("file was not a buffer"));
            } else if (encoding) {
                return q.when(buffer.toString(encoding));
            } else {
                return q.when(buffer);
            }
        });
    }
    
    function exists(path) {
        return !!files[path];
    }
    
    return {
        read: read,
        exists: exists
    };
}
