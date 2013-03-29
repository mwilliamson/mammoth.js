var _ = require("underscore");

exports.topLevelElement = topLevelElement;
exports.elements = elements;
exports.element = element;

function topLevelElement(tagName) {
    return elements([element(tagName, {fresh: true})]);
}

function elements(elementStyles) {
    return elementStyles.map(function(elementStyle) {
        if (_.isString(elementStyle)) {
            return element(elementStyle);
        } else {
            return elementStyle;
        }
    });
}

function element(tagName, options) {
    options = options || {};
    return {
        tagName: tagName,
        fresh: options.fresh
    };
}
