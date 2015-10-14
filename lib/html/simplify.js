var ast = require("./ast");

function simplify(node) {
    return removeEmpty(simplifiers[node.type](node));
}

var simplifiers = {
    fragment: simplifyFragment,
    element: simplifyElement,
    selfClosingElement: identity,
    text: identity,
    forceWrite: identity
};

function simplifyFragment(node) {
    return ast.fragment(simplifyNodes(node.children));
}

function simplifyElement(node) {
    return ast.elementWithTag(node.tag, simplifyNodes(node.children));
}

function identity(value) {
    return value;
}

function simplifyNodes(nodes) {
    var children = [];
    
    nodes.map(simplify).forEach(function(child) {
        appendChild(children, child, children.push.bind(children));
    });
    return children;
}

function appendChild(children, child, append) {
    var lastChild = children[children.length - 1];
    if (child.type === "element" && !child.tag.fresh && lastChild && lastChild.type === "element" && child.tag.matchesElement(lastChild.tag)) {
        child.children.forEach(function(grandChild) {
            // Mutation is fine since simplifying elements create a copy of the children.
            appendChild(lastChild.children, grandChild, lastChild.appendChild.bind(lastChild));
        });
    } else {
        append(child);
    }
}

function removeEmpty(node) {
    return emptiers[node.type](node);
}

var emptiers = {
    fragment: fragmentEmptier,
    element: elementEmptier,
    selfClosingElement: identity,
    text: identity,
    forceWrite: identity
};

function fragmentEmptier(fragment) {
    return ast.fragment(fragment.children.filter(function(child) {
        return !child.isEmpty;
    }));
}

function elementEmptier(element) {
    return ast.elementWithTag(element.tag, element.children.filter(function(child) {
        return !child.isEmpty;
    }));
}


module.exports = simplify;
