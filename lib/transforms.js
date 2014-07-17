exports.paragraph = function(transform) {
    function transformElement(element) {
        if (element.children) {
            for (var i = 0; i < element.children.length; i++) {
                element.children[i] = transformElement(element.children[i]);
            }
        }
        if (element.type === "paragraph") {
            return transform(element);
        } else {
            return element;
        }
    }
    return transformElement;
};
