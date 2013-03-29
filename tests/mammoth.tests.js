var assert = require("assert");
var path = require("path");
var fs = require("fs");
var mammoth = require("../")
var q = require("q");
var test = require("./testing").test;
var styles = require("../lib/styles");


describe('mammoth', function() {
    test('should convert docx containing one one paragraph to single p element', function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("simple/word/document.xml")
        });
        var converter = new mammoth.Converter();
        return converter.convertToHtml(docxFile).then(function(result) {
            assert.equal("<p>Hello.</p>", result.html);
        });
    });
    
    test('options are passed to document converter', function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("simple/word/document.xml")
        });
        var converter = new mammoth.Converter({
            defaultParagraphStyle: styles.topLevelElement("h1")
        });
        return converter.convertToHtml(docxFile).then(function(result) {
            assert.equal("<h1>Hello.</h1>", result.html);
        });
    });
})

function createFakeDocxFile(files) {
    function read(path) {
        return files[path];
    }
    
    return {
        read: read
    };
}

function testData(testDataPath) {
    var fullPath = path.join(__dirname, "test-data", testDataPath);
    return q.nfcall(fs.readFile, fullPath, "utf-8");
}

function convertToHtml(docxFile) {
}
