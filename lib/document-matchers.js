exports.paragraph = paragraph;
exports.run = run;


function paragraph(styleName) {
    return matcher("paragraph", styleName);
}

function run(styleName) {
    return matcher("run", styleName);
}

function matcher(elementType, styleName) {
    return function(element) {
        return element.type === elementType && element.styleName === styleName;
    };
}
