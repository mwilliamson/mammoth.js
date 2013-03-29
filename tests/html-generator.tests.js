var assert = require("assert");
var test = require("./testing").test;

var HtmlGenerator = require("../lib/html-generator").HtmlGenerator;


describe('HtmlGenerator', function() {
    test('generates empty string when newly created', function() {
        var generator = new HtmlGenerator();
        return assert.equal("", generator.asString());
    })
})
