exports.paragraph = paragraph;
exports.run = run;


function paragraph(styleName) {
    return new Matcher("paragraph", styleName);
}

function run(styleName) {
    return new Matcher("run", styleName);
}

function Matcher(elementType, styleName) {
    this._elementType = elementType;
    this._styleName = styleName;
}

Matcher.prototype.matches = function(element) {
    return element.type === this._elementType &&
        (this._styleName === undefined || element.styleName === this._styleName) &&
        (this._listIndex === undefined || isList(element, this._listIndex, this._listIsOrdered));
}

Matcher.prototype.orderedList = function(levelIndex) {
    return this.list({isOrdered: true, levelIndex: levelIndex});
}

Matcher.prototype.unorderedList = function(levelIndex) {
    return this.list({isOrdered: false, levelIndex: levelIndex});
}

Matcher.prototype.list = function(options) {
    this._listIndex = options.levelIndex;
    this._listIsOrdered = options.isOrdered;
    return this;
};

function isList(element, levelIndex, isOrdered) {
    return element.numbering &&
        element.numbering.level == levelIndex &&
        element.numbering.isOrdered == isOrdered;
}
