var assert = require("assert");
var path = require("path");
var fs = require("fs");

var q = require("q");

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
        return converter.convertToHtml({path: docxPath}).then(function(result) {
            assert.equal(result.value, "<p>Walking on imported air</p>");
            assert.deepEqual(result.messages, []);
        });
    });
    
    test('should convert Uint8Array containing one one paragraph to single p element', function() {
        var docxPath = path.join(__dirname, "test-data/single-paragraph.docx");
        
        return q.nfcall(fs.readFile, docxPath).then(function(buffer) {
            var array = new Uint8Array(buffer.length);
            for (var i = 0; i < buffer.length; i++) {
                array[i] = buffer[i];
            }
            var converter = new mammoth.Converter();
            return converter.convertToHtml({uint8Array: array}).then(function(result) {
                assert.equal("<p>Walking on imported air</p>", result.value);
            });
        });
    });
    
    test('options are passed to document converter when creating Converter', function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("simple/word/document.xml")
        });
        var converter = new mammoth.Converter({
            defaultParagraphStyle: htmlPaths.topLevelElement("h1")
        });
        return converter.convertToHtml({file: docxFile}).then(function(result) {
            assert.equal("<h1>Hello.</h1>", result.value);
        });
    });
    
    test('options are passed to document converter when calling mammoth.convertToHtml', function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("simple/word/document.xml")
        });
        var options = {
            defaultParagraphStyle: htmlPaths.topLevelElement("h1")
        };
        return mammoth.convertToHtml({file: docxFile}, options).then(function(result) {
            assert.equal("<h1>Hello.</h1>", result.value);
        });
    });
    
    test('inline images are included in output', function() {
        var converter = new mammoth.Converter();
        var docxPath = path.join(__dirname, "test-data/tiny-picture.docx");
        return converter.convertToHtml({path: docxPath}).then(function(result) {
            assert.equal(result.value, '<p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAAXNSR0IArs4c6QAAAAlwSFlzAAAOvgAADr4B6kKxwAAAABNJREFUKFNj/M+ADzDhlWUYqdIAQSwBE8U+X40AAAAASUVORK5CYII=" /></p>');
        });
    });
    
    test('simple list is converted to list elements', function() {
        var converter = new mammoth.Converter();
        var docxPath = path.join(__dirname, "test-data/simple-list.docx");
        return converter.convertToHtml({path: docxPath}).then(function(result) {
            assert.equal(result.value, '<ul><li>Apple</li><li>Banana</li></ul>');
        });
    });
})
