var _ = require("underscore");

exports.paragraph = paragraph;
exports.run = run;


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
    if (options.list) {
        this._listIndex = options.list.levelIndex;
        this._listIsOrdered = options.list.isOrdered;
    }
}

Matcher.prototype.matches = function(element) {
    return element.type === this._elementType &&
        (this._styleId === undefined || element.styleId === this._styleId) &&
        (this._listIndex === undefined || isList(element, this._listIndex, this._listIsOrdered));
};

Matcher.prototype.orderedList = function(levelIndex) {
    return this.list({isOrdered: true, levelIndex: levelIndex});
};

Matcher.prototype.unorderedList = function(levelIndex) {
    return this.list({isOrdered: false, levelIndex: levelIndex});
};

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
