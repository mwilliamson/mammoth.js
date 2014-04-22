exports.readOptions = readOptions;


var _ = require("underscore");
var style = require("./style-reader").readStyle;


var standardOptions = exports._standardOptions = {
    styleMap: [
        style("p.Heading1 => h1:fresh"),
        style("p.Heading2 => h2:fresh"),
        style("p.Heading3 => h3:fresh"),
        style("p.Heading4 => h4:fresh"),
        style("p[name='Heading 1'] => h1:fresh"),
        style("p[name='Heading 2'] => h2:fresh"),
        style("p[name='Heading 3'] => h3:fresh"),
        style("p[name='Heading 4'] => h4:fresh"),
        style("p:unordered-list(1) => ul > li:fresh"),
        style("p:unordered-list(2) => ul|ol > li > ul > li:fresh"),
        style("p:unordered-list(3) => ul|ol > li > ul|ol > li > ul > li:fresh"),
        style("p:unordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh"),
        style("p:unordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh"),
        style("p:ordered-list(1) => ol > li:fresh"),
        style("p:ordered-list(2) => ul|ol > li > ol > li:fresh"),
        style("p:ordered-list(3) => ul|ol > li > ul|ol > li > ol > li:fresh"),
        style("p:ordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh"),
        style("p:ordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh")
    ],
    transformDocument: identity,
    includeDefaultStyleMap: true
};

function readOptions(options) {
    options = options || {};
    var fullOptions = {};
    _.extend(fullOptions, standardOptions, options);
    
    fullOptions.styleMap = readStyleMap(options)
        .concat(fullOptions.includeDefaultStyleMap ? standardOptions.styleMap : []);
    
    return fullOptions;
}

function readStyleMap(options) {
    var customStyleMap = readCustomStyleMap(options.styleMap);
    return customStyleMap;
}

function readCustomStyleMap(styleMap) {
    if (!styleMap) {
        return [];
    } else if (_.isString(styleMap)) {
        return styleMap.split("\n").map(function(line) {
            return style(line.trim());
        });
    } else {
        return styleMap;
    }
}


function identity(value) {
    return value;
}
