var assert = require("assert");
var test = require("./testing").test;

var fs = require("fs");

var mammoth = require("../lib");



describe("buffer-tests", function() {
    test('should convert docx as Buffer to one HTML paragraph', function() {
        var docxPath = path.join(__dirname, "test-data/single-paragraph.docx");
        var buffer = fs.readFileSync(docxPath);
        return mammoth.convertToHtml({buffer: buffer}).then(function(result) {
            assert.equal(result.value, "<p>Walking on imported air</p>");
            assert.deepEqual(result.messages, []);
        });
    });
    
    test('should convert docx as Buffer to plain text', function() {
        var docxPath = path.join(__dirname, "test-data/single-paragraph.docx");
        var buffer = fs.readFileSync(docxPath);
        return mammoth.extractRawText({buffer: buffer}).then(function(result) {
            assert.equal(result.value, "Walking on imported air\n\n");
            assert.deepEqual(result.messages, []);
        });
    });
});
