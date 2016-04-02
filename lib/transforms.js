var _ = require("underscore");

exports.paragraph = function(transform) {
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
};
