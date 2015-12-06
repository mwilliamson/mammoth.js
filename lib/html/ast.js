var _ = require("underscore");

var htmlPaths = require("../html-paths");


function fragment(children) {
    var collapsedChildren = collapse(children);
    return {
        type: "fragment",
        children: collapsedChildren,
        isEmpty: collapsedChildren.length === 0 || _.all(collapsedChildren, function(child) {
            return child.isEmpty;
        })
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
    var collapsedChildren = collapse(children);
    return {
        type: "element",
        tag: tag,
        children: collapsedChildren,
        isEmpty: collapsedChildren.length === 0 || _.all(collapsedChildren, function(child) {
            return child.isEmpty;
        }),
        appendChild: elementAppendChild
    };
}

function elementAppendChild(child) {
    this.isEmpty = this.isEmpty && child.isEmpty;
    return appendChild(this.children, child, this.children.push.bind(this.children));
}
    
function appendChild(children, child, append) {
    var lastChild = children[children.length - 1];
    if (child.type === "element" && !child.tag.fresh && lastChild && lastChild.type === "element" && child.tag.matchesElement(lastChild.tag)) {
        child.children.forEach(function(grandChild) {
            appendChild(lastChild.children, grandChild, lastChild.appendChild.bind(lastChild));
        });
    } else {
        append(child);
    }
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

function collapse(children) {
    var collapsedChildren = [];
    collapseFragments(children).forEach(function(child) {
        appendChild(collapsedChildren, child, collapsedChildren.push.bind(collapsedChildren));
    });
    return collapsedChildren;
}

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
