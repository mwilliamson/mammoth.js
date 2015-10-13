var assert = require("assert");

var test = require("../testing").test;
var html = require("../../lib/html");


describe("HTML ast", function() {
    test("nested fragments are collapsed", function() {
        assert.deepEqual(
            html.fragment([html.fragment([html.text("Hello")])]),
            html.fragment([html.text("Hello")]));
    });
    
    test("children of elements are collapsed", function() {
        assert.deepEqual(
            html.element("p", {}, [html.fragment([html.text("Hello")])]),
            html.element("p", {}, [html.text("Hello")]));
    });
});

