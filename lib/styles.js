exports.topLevelElement = topLevelElement;
exports.elements = elements;

function topLevelElement(tagName) {
    return elements([tagName]);
}

function elements(tagNames) {
    return tagNames;
}
