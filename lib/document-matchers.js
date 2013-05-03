exports.paragraph = paragraph;
exports.run = run;


function paragraph(styleName) {
    return new Matcher("paragraph", styleName);
}

function run(styleName) {
    return new Matcher("run", styleName);
}

function Matcher(elementType, styleName) {
    this.elementType = elementType;
    this.styleName = styleName;
}

Matcher.prototype.matches = function(element) {
    return element.type === this.elementType && element.styleName === this.styleName;
}
