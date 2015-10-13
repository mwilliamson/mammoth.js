var _ = require("underscore");

function fragment(children) {
    return {
        type: "fragment",
        children: collapseFragments(children || [])
    };
}

function text(value) {
    return {
        type: "text",
        value: value
    };
}

function collapseFragments(elements) {
    return _.flatten(elements.map(function(element) {
        return element.type === "fragment" ? element.children : [element];
    }), true)
}

exports.fragment = fragment;
exports.text = text;
