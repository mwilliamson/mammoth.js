var assert = require("assert");

var test = require("../testing").test;
var html = require("../../lib/html");
var htmlPaths = require("../../lib/html-paths");


var nonFreshElement = html.nonFreshElement;
var fragment = html.fragment;
var text = html.text;
var pathToNode = html.pathToNode;

describe("simplify", function() {
    test("empty text nodes are removed", function() {
        assert.deepEqual(
            html.simplify(fragment([text("")])),
            fragment([]));
    });
    
    test("elements with no children are removed", function() {
        assert.deepEqual(
            html.simplify(fragment([nonFreshElement("p", {}, [])])),
            fragment([]));
    });
    
    test("elements only containing empty nodes are removed", function() {
        assert.deepEqual(
            html.simplify(fragment([nonFreshElement("p", {}, [text("")])])),
            fragment([]));
    });
    
    test("children of element is simplified", function() {
        assert.deepEqual(
            html.simplify(fragment([nonFreshElement("p", {}, [text("Hello"), text("")])])),
            fragment([nonFreshElement("p", {}, [text("Hello")])]));
    });
    
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
    
    test("non-fresh can collapse into preceding non-fresh element", function() {
        var freshPath = htmlPaths.elements([
            htmlPaths.element("p", {}, {fresh: true})]);
        var nonFreshPath = htmlPaths.elements([
            htmlPaths.element("p", {}, {fresh: false})]);
        assert.deepEqual(
            html.simplify(fragment([
                pathToNode(freshPath, [text("Hello")]),
                pathToNode(nonFreshPath, [text(" there")])])),
            fragment([
                pathToNode(freshPath, [text("Hello"), text(" there")])]));
    });
});
