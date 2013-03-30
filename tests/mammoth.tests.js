var assert = require("assert");

var mammoth = require("../")
var styles = require("../lib/styles");

var testing = require("./testing");
var test = testing.test;
var testData = testing.testData;
var createFakeDocxFile = testing.createFakeDocxFile;


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
