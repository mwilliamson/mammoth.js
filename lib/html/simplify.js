var ast = require("./ast");

function simplify(node) {
    return collapse(removeEmpty(node));
}

function collapse(node) {
    return collapsers[node.type](node);
}

var collapsers = {
    fragment: collapseFragment,
    element: collapseElement,
    selfClosingElement: identity,
    text: identity,
    forceWrite: identity
};

function collapseFragment(node) {
    return ast.fragment(collapseNodes(node.children));
}

function collapseElement(node) {
    return ast.elementWithTag(node.tag, collapseNodes(node.children));
}

function identity(value) {
    return value;
}

function collapseNodes(nodes) {
    var children = [];
    
    nodes.map(collapse).forEach(function(child) {
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
    return ast.fragment(listEmptier(fragment.children));
}

function elementEmptier(element) {
    return ast.elementWithTag(element.tag, listEmptier(element.children));
}

function listEmptier(elements) {
    return elements.map(removeEmpty).filter(function(child) {
        return !child.isEmpty;
    });
}


module.exports = simplify;
