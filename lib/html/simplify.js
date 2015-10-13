var _ = require("underscore");

var ast = require("./ast");

function simplify(node) {
    return simplifiers[node.type](node);
};

var simplifiers = {
    fragment: simplifyFragment,
    element: simplifyElement,
    text: simplifyText
};

function simplifyFragment(node) {
    return ast.fragment(simplifyNodes(node.children));
}

function simplifyElement(node) {
    return ast.elementWithTag(node.tag, simplifyNodes(node.children));
}

function simplifyText(node) {
    return node;
}

function simplifyNodes(nodes) {
    var children = [];
    
    nodes.map(simplify).forEach(function(child) {
        var lastChild = children[children.length - 1];
        if (child.type === "element" && !child.tag.fresh && lastChild && _.isEqual(lastChild.tag, child.tag)) {
            child.children.forEach(function(grandChild) {
                // Mutation is fine since simplifying elements create a copy of the children.
                lastChild.children.push(grandChild);
            });
        } else {
            children.push(child);
        }
    });
    return children;
}

module.exports = simplify;
