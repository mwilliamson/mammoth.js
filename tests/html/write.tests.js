var assert = require("assert");

var test = require("../testing").test;
var html = require("../../lib/html");
var writers = require("../../lib/writers");


describe("HTML write", function() {
    test("text is HTML escaped", function() {
        assert.equal(
            generateString(html.text("<>&")),
            "&lt;&gt;&amp;");
    });
    
    test("double quotes outside of attributes are not escaped", function() {
        assert.equal(
            generateString(html.text('"')),
            '"');
    });
    
    test("element attributes are HTML escaped", function() {
        assert.equal(
            generateString(html.freshElement("p", {"x": "<"}, [html.forceWrite])),
            '<p x="&lt;"></p>');
    });
    
    test("double quotes inside attributes are escaped", function() {
        assert.equal(
            generateString(html.freshElement("p", {"x": '"'}, [html.forceWrite])),
            '<p x="&quot;"></p>');
    });
    
    test("element children are written", function() {
        assert.equal(
            generateString(html.freshElement("p", {}, [html.text("Hello")])),
            '<p>Hello</p>');
    });
});

function generateString(node) {
    var writer = writers.writer();
    html.write(writer, node);
    return writer.asString();
}
