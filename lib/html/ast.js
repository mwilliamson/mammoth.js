var htmlPaths = require("../styles/html-paths");


function nonFreshElement(tagName, attributes, children) {
    return elementWithTag(
        htmlPaths.element(tagName, attributes, {fresh: false}),
        children);
}

function freshElement(tagName, attributes, children) {
    var tag = htmlPaths.element(tagName, attributes, {fresh: true});
    return elementWithTag(tag, children);
}

var voidTagNames = {
    "br": true,
    "hr": true,
    "img": true
};

function elementWithTag(tag, children) {
    if (isVoidElement(tag.tagName, children)) {
        return selfClosingElement(tag.tagName, tag.attributes);
    } else {
        return {
            type: "element",
            tag: tag,
            children: children || []
        };
    }
}

function isVoidElement(tagName, children) {
    return (!children || children.length === 0) && voidTagNames[tagName];
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
exports.text = text;
exports.forceWrite = forceWrite;
