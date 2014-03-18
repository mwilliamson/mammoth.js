var assert = require("assert");
var child_process = require("child_process");
var path = require("path");
var fs = require("fs");

var temp = require('temp').track();

var promises = require("../lib/promises");
var test = require("./testing").test;
var testPath = require("./testing").testPath;

describe("CLI", function() {
    test("HTML is printed to stdout if output file is not set", function() {
        return runMammoth(testPath("single-paragraph.docx")).then(function(result) {
            assert.equal(result.stderrOutput, "")
            assert.equal(result.output, "<p>Walking on imported air</p>")
        });
    });
    
    test("HTML is written to file if output file is set", function() {
        return createTempDir().then(function(tempDir) {
            var outputPath = path.join(tempDir, "output.html");
            return runMammoth(testPath("single-paragraph.docx"), outputPath).then(function(result) {
                assert.equal(result.stderrOutput, "")
                assert.equal(result.output, "")
                assert.equal(fs.readFileSync(outputPath), "<p>Walking on imported air</p>");
            });
        });
    });
});

function runMammoth() {
    var args = Array.prototype.slice.call(arguments, 0);
    var deferred = promises.defer();
    
    var processArgs = ["node", "lib/main.js"].concat(args);
    // TODO: proper escaping of args
    var command = processArgs.join(" ");
    child_process.exec(command, function(error, stdout, stderr) {
        console.log(stderr);
        assert.equal(error, null);
        deferred.resolve({output: stdout, stderrOutput: stderr});
    });
    
    return deferred.promise;
}

function createTempDir() {
    return promises.nfcall(temp.mkdir, null);
}
