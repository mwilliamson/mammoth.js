var path = require("path");
var fs = require("fs");
var q = require("q");

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
    function read(path) {
        return files[path];
    }
    
    return {
        read: read
    };
}
