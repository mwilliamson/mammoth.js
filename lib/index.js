var extend = require("xtend");
var _ = require("underscore");

var docxReader = require("./docx-reader");
var DocumentConverter = require("./document-to-html").DocumentConverter;
var style = require("./style-reader").readStyle;

exports.convertToHtml = convertToHtml;
exports.style = style;
var standardOptions = {
    styleMap: [
        style("p.Heading1 => h1:fresh"),
        style("p.Heading2 => h2:fresh"),
        style("p.Heading3 => h3:fresh"),
        style("p.Heading4 => h4:fresh"),
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
    transformDocument: identity
};

function convertToHtml(input, options) {
    options = options || {};
    if (options.styleMap && _.isString(options.styleMap)) {
        options.styleMap = options.styleMap.split("\n").map(function(line) {
            return style(line.trim());
        });
    }
    
    var fullOptions = extend(standardOptions, options);
    
    return docxReader.read(input)
        .then(function(documentResult) {
            return documentResult.map(fullOptions.transformDocument);
        })
        .then(function(documentResult) {
            return convertDocumentToHtml(documentResult, fullOptions);
        });
}

function convertDocumentToHtml(documentResult, options) {
    var documentConverter = new DocumentConverter(options);
    return documentResult.flatMapThen(function(document) {
        return documentConverter.convertToHtml(document);
    });
}

function identity(value) {
    return value;
}
