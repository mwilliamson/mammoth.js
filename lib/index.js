var docxReader = require("./docx/docx-reader");
var DocumentConverter = require("./document-to-html").DocumentConverter;
var readStyle = require("./style-reader").readStyle;
var readOptions = require("./options-reader").readOptions;

exports.convertToHtml = convertToHtml;
exports.convertToMarkdown = convertToMarkdown;
exports.convert = convert;
exports.extractRawText = extractRawText;
exports.images = require("./images");
exports.transforms = require("./transforms");
exports.underline = require("./underline");

function convertToHtml(input, options) {
    return convert(input, options);
}

function convertToMarkdown(input, options) {
    var markdownOptions = Object.create(options || {});
    markdownOptions.outputFormat = "markdown";
    return convert(input, markdownOptions);
}

function convert(input, options) {
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


function extractRawText(input) {
    return docxReader.read(input)
        .then(function(documentResult) {
            return documentResult.map(convertElementToRawText);
        });
}

function convertElementToRawText(element) {
    if (element.type === "text") {
        return element.value;
    } else {
        var tail = element.type === "paragraph" ? "\n\n" : "";
        return (element.children || []).map(convertElementToRawText).join("") + tail;
    }
}

exports.styleMapping = function() {
    throw new Error('Use a raw string instead of mammoth.styleMapping e.g. "p[style-name=\'Title\'] => h1" instead of mammoth.styleMapping("p[style-name=\'Title\'] => h1")');
};
