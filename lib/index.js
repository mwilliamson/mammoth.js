var docxReader = require("./docx-reader");
var DocumentConverter = require("./document-to-html").DocumentConverter;
var htmlPaths = require("./html-paths");

exports.Converter = Converter;
exports.read = read;
exports.convertDocumentToHtml = convertDocumentToHtml;
exports.htmlPaths = htmlPaths;
exports.standardOptions = {
    paragraphStyleMap: {
        "Heading1": htmlPaths.topLevelElement("h1"),
        "Heading2": htmlPaths.topLevelElement("h2"),
        "Heading3": htmlPaths.topLevelElement("h3"),
        "Heading4": htmlPaths.topLevelElement("h4"),
        "ListParagraph": htmlPaths.elements([
            htmlPaths.element("ul"),
            htmlPaths.element("li", {}, {fresh: true})
        ])
    }
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
