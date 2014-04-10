var assert = require("assert");
var test = require("./testing").test;

var htmlWriter = require("../lib/html-writer");


describe('html-writer', function() {
    test('can generate simple paragraph', function() {
        var writer = htmlWriter.writer();
        writer.open("p");
        writer.text("Hello");
        writer.close("p");
        return assert.equal("<p>Hello</p>", writer.asString());
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
        return assert.equal("<ul><li>One</li><li>Two</li></ul>", writer.asString());
    });
})
