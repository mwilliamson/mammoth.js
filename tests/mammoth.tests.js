var assert = require("assert");
var path = require("path");
var fs = require("fs");

var promises = require("../lib/promises");

var mammoth = require("../")
var htmlPaths = require("../lib/html-paths");
var documentMatchers = require("../lib/document-matchers");

var testing = require("./testing");
var test = testing.test;
var testData = testing.testData;
var createFakeDocxFile = testing.createFakeDocxFile;


describe('mammoth', function() {
    test('should convert docx containing one paragraph to single p element', function() {
        var docxPath = path.join(__dirname, "test-data/single-paragraph.docx");
        return mammoth.convertToHtml({path: docxPath}).then(function(result) {
            assert.equal(result.value, "<p>Walking on imported air</p>");
            assert.deepEqual(result.messages, []);
        });
    });
    
    test('style map can be expressed as string', function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("simple/word/document.xml")
        });
        var options = {
            styleMap: "p => h1"
        };
        return mammoth.convertToHtml({file: docxFile}, options).then(function(result) {
            assert.equal("<h1>Hello.</h1>", result.value);
        });
    });
    
    test('style map can be expressed as array of styles', function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("simple/word/document.xml")
        });
        var options = {
            styleMap: [mammoth.styleMapping("p => h1")]
        };
        return mammoth.convertToHtml({file: docxFile}, options).then(function(result) {
            assert.equal("<h1>Hello.</h1>", result.value);
        });
    });
    
    test('options are passed to document converter when calling mammoth.convertToHtml', function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("simple/word/document.xml")
        });
        var options = {
            styleMap: "p => h1"
        };
        return mammoth.convertToHtml({file: docxFile}, options).then(function(result) {
            assert.equal("<h1>Hello.</h1>", result.value);
        });
    });
    
    test('options.transformDocument is used to transform document if set', function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("simple/word/document.xml")
        });
        var options = {
            transformDocument: function(document) {
                document.children[0].styleName = "Heading1";
                return document;
            }
        };
        return mammoth.convertToHtml({file: docxFile}, options).then(function(result) {
            assert.equal("<h1>Hello.</h1>", result.value);
        });
    });
    
    test('inline images are included in output', function() {
        var docxPath = path.join(__dirname, "test-data/tiny-picture.docx");
        return mammoth.convertToHtml({path: docxPath}).then(function(result) {
            assert.equal(result.value, '<p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAAXNSR0IArs4c6QAAAAlwSFlzAAAOvgAADr4B6kKxwAAAABNJREFUKFNj/M+ADzDhlWUYqdIAQSwBE8U+X40AAAAASUVORK5CYII=" /></p>');
        });
    });
    
    test('simple list is converted to list elements', function() {
        var docxPath = path.join(__dirname, "test-data/simple-list.docx");
        return mammoth.convertToHtml({path: docxPath}).then(function(result) {
            assert.equal(result.value, '<ul><li>Apple</li><li>Banana</li></ul>');
        });
    });
    
    test('newlines and indentation are used if prettyPrint is true', function() {
        var docxPath = path.join(__dirname, "test-data/simple-list.docx");
        return mammoth.convertToHtml({path: docxPath}, {prettyPrint: true}).then(function(result) {
            assert.equal(result.value, '<ul>\n  <li>Apple</li>\n  <li>Banana</li>\n</ul>');
        });
    });
})
