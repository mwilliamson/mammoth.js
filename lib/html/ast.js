var htmlPaths = require("../styles/html-paths");


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
        children: children || []
    };
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
        value: value
    };
}

var forceWrite = {
    type: "forceWrite"
};

exports.freshElement = freshElement;
exports.nonFreshElement = nonFreshElement;
exports.elementWithTag = elementWithTag;
exports.selfClosingElement = selfClosingElement;
exports.text = text;
exports.forceWrite = forceWrite;
