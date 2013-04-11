var docxReader = require("./docx-reader");
var DocumentConverter = require("./document-to-html").DocumentConverter;
var htmlPaths = require("./html-paths");

exports.Converter = Converter;
exports.standardOptions = {
    paragraphStyleMap: {
        "Heading1": htmlPaths.topLevelElement("h1"),
        "Heading2": htmlPaths.topLevelElement("h2"),
        "Heading3": htmlPaths.topLevelElement("h3"),
        "Heading4": htmlPaths.topLevelElement("h4")
    }
};

function Converter(options) {
    this._documentConverter = new DocumentConverter(options);
}

Converter.prototype.convertToHtml = function(inputOptions) {
    var documentConverter = this._documentConverter;
    return docxReader.read(inputOptions)
        .then(function(documentResult) {
            return documentResult.mapThen(function(document) {
                return documentConverter.convertToHtml(document);
            });
        }).then(function(result) {
            result.html = result.value.html;
            return result;
        });
}
