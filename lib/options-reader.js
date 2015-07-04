exports.readOptions = readOptions;


var _ = require("underscore");


var standardOptions = exports._standardOptions = {
    styleMap: [
        "p[style-name='Normal'] => p:fresh",
    
        "p.Heading1 => h1:fresh",
        "p.Heading2 => h2:fresh",
        "p.Heading3 => h3:fresh",
        "p.Heading4 => h4:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='heading 1'] => h1:fresh",
        "p[style-name='heading 2'] => h2:fresh",
        "p[style-name='heading 3'] => h3:fresh",
        "p[style-name='heading 4'] => h4:fresh",
        "p[style-name='heading 4'] => h4:fresh",
        
        "r[style-name='Strong'] => strong",
        
        "p[style-name='footnote text'] => p",
        "r[style-name='footnote reference'] =>",
        "p[style-name='endnote text'] => p",
        "r[style-name='endnote reference'] =>",
        
        // LibreOffice
        "p[style-name='Footnote'] => p",
        "r[style-name='Footnote anchor'] =>",
        "p[style-name='Endnote'] => p",
        "r[style-name='Endnote anchor'] =>",
        
        "p:unordered-list(1) => ul > li:fresh",
        "p:unordered-list(2) => ul|ol > li > ul > li:fresh",
        "p:unordered-list(3) => ul|ol > li > ul|ol > li > ul > li:fresh",
        "p:unordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh",
        "p:unordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh",
        "p:ordered-list(1) => ol > li:fresh",
        "p:ordered-list(2) => ul|ol > li > ol > li:fresh",
        "p:ordered-list(3) => ul|ol > li > ul|ol > li > ol > li:fresh",
        "p:ordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh",
        "p:ordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh",
        
        "r[style-name='Hyperlink'] =>"
    ],
    transformDocument: identity,
    includeDefaultStyleMap: true
};

function readOptions(options) {
    options = options || {};
    var fullOptions = {};
    _.extend(fullOptions, standardOptions, options);
    
    fullOptions.styleMap = readStyleMap(options.styleMap, fullOptions);
    
    return fullOptions;
}

function readStyleMap(styleMap, options) {
    var customStyleMap = readCustomStyleMap(styleMap);
    return customStyleMap.concat(options.includeDefaultStyleMap ? standardOptions.styleMap : []);
}

function readCustomStyleMap(styleMap) {
    if (!styleMap) {
        return [];
    } else if (_.isString(styleMap)) {
        return styleMap.split("\n").map(function(line) {
            return line.trim();
        });
    } else {
        return styleMap;
    }
}


function identity(value) {
    return value;
}
