var docxReader = require("./docx/docx-reader");
var DocumentConverter = require("./document-to-html").DocumentConverter;
var readStyle = require("./style-reader").readStyle;
var readOptions = require("./options-reader").readOptions;

exports.convertToHtml = convertToHtml;

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
    var parsedOptions = Object.create(options);
    parsedOptions.styleMap = (options.styleMap || []).map(readStyle);
    var documentConverter = new DocumentConverter(parsedOptions);
    return documentResult.flatMapThen(function(document) {
        return documentConverter.convertToHtml(document);
    });
}
