var _ = require("underscore");

exports.paragraph = paragraph;
exports.getDescendantsOfType = getDescendantsOfType;
exports.getDescendants = getDescendants;

function paragraph(transform) {
    function transformElement(element) {
        if (element.children) {
            var children = _.map(element.children, transformElement);
            element = _.extend(element, {children: children});
        }
        
        if (element.type === "paragraph") {
            element = transform(element);
        }
        
        return element;
    }
    return transformElement;
}


function getDescendantsOfType(element, type) {
    return getDescendants(element).filter(function(descendant) {
        return descendant.type === type;
    });
}

function getDescendants(element) {
    var descendants = [];

    visitDescendants(element, function(descendant) {
        descendants.push(descendant);
    });

    return descendants;
}

function visitDescendants(element, visit) {
    if (element.children) {
        element.children.forEach(function(child) {
            visitDescendants(child, visit);
            visit(child);
        });
    }
}
