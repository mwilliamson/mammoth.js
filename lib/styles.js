var _ = require("underscore");

exports.topLevelElement = topLevelElement;
exports.elements = elements;
exports.element = element;

function topLevelElement(tagName, attributes) {
    return elements([element(tagName, attributes, {fresh: true})]);
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

function element(tagName, attributes, options) {
    options = options || {};
    return {
        tagName: tagName,
        attributes: attributes || {},
        fresh: options.fresh
    };
}
