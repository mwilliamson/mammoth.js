var docxReader = require("./docx-reader");
var DocumentConverter = require("./document-to-html").DocumentConverter;
var htmlPaths = require("./html-paths");
var documentMatchers = require("./document-matchers");
var style = require("./style-reader").readStyle;

exports.Converter = Converter;
exports.read = read;
exports.convertDocumentToHtml = convertDocumentToHtml;
exports.htmlPaths = htmlPaths;
exports.standardOptions = {
    styleMap: [
        style("p.Heading1 => h1"),
        style("p.Heading2 => h2"),
        style("p.Heading3 => h3"),
        style("p.Heading4 => h4"),
        style("p.ListParagraph => ul > li:fresh")
    ]
};

function Converter(options) {
    this._options = options;
}

Converter.prototype.convertToHtml = function(inputOptions) {
    var options = this._options;
    return read(inputOptions)
        .then(function(documentResult) {
            return convertDocumentToHtml(documentResult, options);
        });
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
