var _ = require("underscore");

var htmlPaths = require("../html-paths");


function fragment(children) {
    return {
        type: "fragment",
        children: collapseFragments(children)
    };
}

function nonFreshElement(tagName, attributes, children) {
    return elementWithTag(
        htmlPaths.element(tagName, attributes, {fresh: false}),
        children);
}

function freshElement(tagName, attributes, children) {
    return elementWithTag(
        htmlPaths.element(tagName, attributes, {fresh: true}),
        children);
}

function elementWithTag(tag, children) {
    return {
        type: "element",
        tag: tag,
        children: collapseFragments(children),
        isEmpty: _.all(children, function(child) {
            return child.isEmpty;
        }),
        appendChild: appendChild
    };
}
    
function appendChild(child) {
    this.children.push(child);
    this.isEmpty = this.isEmpty && child.isEmpty;
}

function selfClosingElement(tagName, attributes) {
    return {
        type: "selfClosingElement",
        tagName: tagName,
        attributes: attributes
    };
}

function text(value) {
    return {
        type: "text",
        value: value,
        isEmpty: !value
    };
}

var forceWrite = {
    type: "forceWrite",
    isEmpty: false
};

function collapseFragments(elements) {
    return _.flatten((elements || []).map(function(element) {
        return element.type === "fragment" ? element.children : [element];
    }), true);
}

exports.fragment = fragment;
exports.freshElement = freshElement;
exports.nonFreshElement = nonFreshElement;
exports.elementWithTag = elementWithTag;
exports.selfClosingElement = selfClosingElement;
exports.text = text;
exports.forceWrite = forceWrite;
