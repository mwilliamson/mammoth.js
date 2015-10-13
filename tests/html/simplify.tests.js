var assert = require("assert");

var test = require("../testing").test;
var html = require("../../lib/html");
var htmlPaths = require("../../lib/html-paths");


var fragment = html.fragment;
var element = html.element;
var text = html.text;
var pathToNode = html.pathToNode;

describe("simplify", function() {
    test("successive fresh elements are not collapsed", function() {
        var path = htmlPaths.elements([
            htmlPaths.element("p", {}, {fresh: true})]);
        var original = fragment([
            pathToNode(path, [text("Hello")]),
            pathToNode(path, [text(" there")])]);
        
        assert.deepEqual(
            html.simplify(original),
            original);
    });
    
    test("successive plain non-fresh elements are collapsed if they have the same tag name", function() {
        var path = htmlPaths.elements([
            htmlPaths.element("p", {}, {fresh: false})]);
        assert.deepEqual(
            html.simplify(fragment([
                pathToNode(path, [text("Hello")]),
                pathToNode(path, [text(" there")])])),
            fragment([
                pathToNode(path, [text("Hello"), text(" there")])]));
    });
});
