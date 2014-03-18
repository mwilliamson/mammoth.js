var docxReader = require("./docx/docx-reader");
var DocumentConverter = require("./document-to-html").DocumentConverter;
var styleMapping = require("./style-reader").readStyle;
var readOptions = require("./options-reader").readOptions;

exports.convertToHtml = convertToHtml;
exports.styleMapping = styleMapping;

function convertToHtml(input, options) {
    var fullOptions = readOptions(options);
    
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
