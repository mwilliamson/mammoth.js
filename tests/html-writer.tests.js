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
})
