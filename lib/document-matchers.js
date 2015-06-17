exports.paragraph = paragraph;
exports.run = run;
exports.underline = new Matcher("underline");
exports.strikethrough = new Matcher("strikethrough");


function paragraph(options) {
    return new Matcher("paragraph", options);
}

function run(options) {
    return new Matcher("run", options);
}

function Matcher(elementType, options) {
    options = options || {};
    this._elementType = elementType;
    this._styleId = options.styleId;
    this._styleName = options.styleName;
    if (options.list) {
        this._listIndex = options.list.levelIndex;
        this._listIsOrdered = options.list.isOrdered;
    }
}

Matcher.prototype.matches = function(element) {
    return element.type === this._elementType &&
        (this._styleId === undefined || element.styleId === this._styleId) &&
        (this._styleName === undefined || (element.styleName && element.styleName.toUpperCase() === this._styleName.toUpperCase())) &&
        (this._listIndex === undefined || isList(element, this._listIndex, this._listIsOrdered));
};

function isList(element, levelIndex, isOrdered) {
    return element.numbering &&
        element.numbering.level == levelIndex &&
        element.numbering.isOrdered == isOrdered;
}
