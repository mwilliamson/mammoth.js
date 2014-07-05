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
    
    test('style map can be expressed as array of style mappings', function() {
        var docxFile = createFakeDocxFile({
            "word/document.xml": testData("simple/word/document.xml")
        });
        var options = {
            styleMap: ["p => h1"]
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
                document.children[0].styleId = "Heading1";
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
    
    test('word tables are converted to html tables', function() {
        // TODO: enable this test once tables are supported
        return;
        var docxPath = path.join(__dirname, "test-data/tables.docx");
        return mammoth.convertToHtml({path: docxPath}).then(function(result) {
            assert.equal(result.value, "<p>Above</p><table><tr><td>Top left</td><td>Top right</td></tr><tr><td>Bottom left</td><td>Bottom right</td></tr></table><p>Below</p>");
            assert.deepEqual(result.messages, []);
        });
    });
    
    test('footnotes are appended to text', function() {
        // TODO: don't duplicate footnotes with multiple references
        var docxPath = path.join(__dirname, "test-data/footnotes.docx");
        var options = {
            generateUniquifier: function() { return 42; }
        };
        return mammoth.convertToHtml({path: docxPath}, options).then(function(result) {
            var expectedOutput = '<p>Ouch' +
                '<sup><a href="#footnote-42-1" id="footnote-ref-42-1">[1]</a></sup>.' +
                '<sup><a href="#footnote-42-2" id="footnote-ref-42-2">[2]</a></sup></p>' +
                '<ol><li id="footnote-42-1"><p> A tachyon walks into a bar. <a href="#footnote-ref-42-1">↑</a></p></li>' +
                '<li id="footnote-42-2"><p> Fin. <a href="#footnote-ref-42-2">↑</a></p></li></ol>'
            assert.equal(result.value, expectedOutput);
            // TODO: get rid of warnings
            //~ assert.deepEqual(result.messages, []);
        });
    });
    
    test('indentation is used if prettyPrint is true', function() {
        var docxPath = path.join(__dirname, "test-data/single-paragraph.docx");
        return mammoth.convertToHtml({path: docxPath}, {prettyPrint: true}).then(function(result) {
            assert.equal(result.value, "<p>\n  Walking on imported air\n</p>");
            assert.deepEqual(result.messages, []);
        });
    });
    
    test('using styleMapping throws error', function() {
        try {
            mammoth.styleMapping()
        } catch (error) {
            assert.equal(
                error.message,
                'Use a raw string instead of mammoth.styleMapping e.g. "p[style-naming=\'Title\'] => h1" instead of mammoth.styleMapping("p[style-naming=\'Title\'] => h1")'
            );
        }
    });
})
