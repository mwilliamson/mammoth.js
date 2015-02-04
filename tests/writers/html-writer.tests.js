var assert = require("assert");
var test = require("../testing").test;

var htmlWriter = require("../../lib/writers/html-writer");


describe('html-writer', function() {
    test('can generate simple paragraph', function() {
        var writer = htmlWriter.writer();
        writer.open("p");
        writer.text("Hello");
        writer.close("p");
        return assert.equal(writer.asString(), "<p>Hello</p>");
    });
    
    test('can nest elements', function() {
        var writer = htmlWriter.writer();
        writer.open("ul");
        writer.open("li");
        writer.text("One");
        writer.close("li");
        writer.open("li");
        writer.text("Two");
        writer.close("li");
        writer.close("ul");
        return assert.equal(writer.asString(), "<ul><li>One</li><li>Two</li></ul>");
    });
    
    test('indents text if prettyPrint is true', function() {
        var writer = htmlWriter.writer({prettyPrint: true});
        writer.open("p");
        writer.text("One");
        writer.close("p");
        writer.open("p");
        writer.text("Two");
        writer.close("p");
        return assert.equal(writer.asString(), "<p>\n  One\n</p>\n<p>\n  Two\n</p>");
    });
    
    test('indents element if prettyPrint is true', function() {
        var writer = htmlWriter.writer({prettyPrint: true});
        writer.open("ul");
        writer.open("li");
        writer.text("One");
        writer.close("li");
        writer.open("li");
        writer.text("Two");
        writer.close("li");
        writer.close("ul");
        return assert.equal(writer.asString(), "<ul>\n  <li>One</li>\n  <li>Two</li>\n</ul>");
    });
    
    test('indents closing element correctly when nested inside another indented element', function() {
        var writer = htmlWriter.writer({prettyPrint: true});
        writer.open("div");
        writer.open("div");
        writer.open("div");
        writer.text("Hello");
        writer.close("div");
        writer.close("div");
        writer.close("div");
        return assert.equal(writer.asString(), "<div>\n  <div>\n    <div>\n      Hello\n    </div>\n  </div>\n</div>");
    });
    
    test('newlines in text are indented', function() {
        var writer = htmlWriter.writer({prettyPrint: true});
        writer.open("p");
        writer.text("One\nTwo");
        writer.close("p");
        return assert.equal(writer.asString(), "<p>\n  One\n  Two\n</p>");
    });
    
    test('run of text has only one new line', function() {
        var writer = htmlWriter.writer({prettyPrint: true});
        writer.open("p");
        writer.text("One");
        writer.text("Two");
        writer.close("p");
        return assert.equal(writer.asString(), "<p>\n  OneTwo\n</p>");
    });
    
    test('run of html has only one new line', function() {
        var writer = htmlWriter.writer({prettyPrint: true});
        writer.open("p");
        writer.append("One");
        writer.append("Two");
        writer.close("p");
        return assert.equal(writer.asString(), "<p>\n  OneTwo\n</p>");
    });
    
    test('self closing elements are indented', function() {
        var writer = htmlWriter.writer({prettyPrint: true});
        writer.open("p");
        writer.selfClosing("br");
        writer.close("p");
        return assert.equal(writer.asString(), "<p>\n  <br />\n</p>");
    });
    
    test('newlines in appended HTML are indented', function() {
        var writer = htmlWriter.writer({prettyPrint: true});
        writer.open("p");
        writer.append("One\nTwo");
        writer.close("p");
        return assert.equal(writer.asString(), "<p>\n  One\n  Two\n</p>");
    });
});
