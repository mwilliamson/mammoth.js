var _ = require("underscore");

var htmlPaths = require("../html-paths");


function fragment(children) {
    return {
        type: "fragment",
        children: collapseFragments(children)
    };
}

function element(tagName, attributes, children) {
    return elementWithTag(
        htmlPaths.element(tagName, attributes, {fresh: true}),
        children);
}

function elementWithTag(tag, children) {
    return {
        type: "element",
        tag: tag,
        children: collapseFragments(children)
    };
}

function text(value) {
    return {
        type: "text",
        value: value
    };
}

function collapseFragments(elements) {
    return _.flatten((elements || []).map(function(element) {
        return element.type === "fragment" ? element.children : [element];
    }), true)
}

exports.fragment = fragment;
exports.element = element;
exports.elementWithTag = elementWithTag;
exports.text = text;
