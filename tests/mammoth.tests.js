var assert = require("assert");
var path = require("path");

var mammoth = require("../")
var htmlPaths = require("../lib/html-paths");

var testing = require("./testing");
var test = testing.test;
var testData = testing.testData;
var createFakeDocxFile = testing.createFakeDocxFile;


describe('mammoth', function() {
    test('should convert docx containing one one paragraph to single p element', function() {
        var docxPath = path.join(__dirname, "test-data/single-paragraph.docx");
        var converter = new mammoth.Converter();
        return converter.convertToHtml(docxPath).then(function(result) {
            assert.equal("<p>Walking on imported air</p>", result.html);
        });
    });
    
    test('options are passed to document converter', function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("simple/word/document.xml")
        });
        var converter = new mammoth.Converter({
            defaultParagraphStyle: htmlPaths.topLevelElement("h1")
        });
        return converter.convertToHtml(docxFile).then(function(result) {
            assert.equal("<h1>Hello.</h1>", result.html);
        });
    });
    
    test('inline images are included in output', function() {
        var converter = new mammoth.Converter();
        var docxPath = path.join(__dirname, "test-data/tiny-picture.docx");
        return converter.convertToHtml(docxPath).then(function(result) {
            assert.equal(result.html, '<p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAAXNSR0IArs4c6QAAAAlwSFlzAAAOvgAADr4B6kKxwAAAABNJREFUKFNj/M+ADzDhlWUYqdIAQSwBE8U+X40AAAAASUVORK5CYII=" /></p>');
        });
    });
})
