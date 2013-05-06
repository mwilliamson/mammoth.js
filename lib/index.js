var docxReader = require("./docx-reader");
var DocumentConverter = require("./document-to-html").DocumentConverter;
var htmlPaths = require("./html-paths");
var documentMatchers = require("./document-matchers");
var style = require("./style-reader").readStyle;

exports.Converter = Converter;
exports.convertToHtml = convertToHtml;
exports.read = read;
exports.convertDocumentToHtml = convertDocumentToHtml;
exports.htmlPaths = htmlPaths;
exports.style = style;
var standardOptions = exports.standardOptions = {
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
    ]
};

function Converter(options) {
    this._options = options || standardOptions;
}

Converter.prototype.convertToHtml = function(inputOptions) {
    var options = this._options;
    return read(inputOptions)
        .then(function(documentResult) {
            return convertDocumentToHtml(documentResult, options);
        });
}

function convertToHtml(input, options) {
    var converter = new Converter(options);
    return converter.convertToHtml(input);
}

function read(inputOptions) {
    return docxReader.read(inputOptions);
}

function convertDocumentToHtml(documentResult, options) {
    var documentConverter = new DocumentConverter(options);
    return documentResult.flatMapThen(function(document) {
        return documentConverter.convertToHtml(document);
    });
}
