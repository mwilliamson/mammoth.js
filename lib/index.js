var docxReader = require("./docx-reader");
var DocumentConverter = require("./document-to-html").DocumentConverter;
var styles = require("./styles");

exports.Converter = Converter;
exports.standardOptions = {
    paragraphStyleMap: {
        "Heading1": styles.topLevelElement("h1"),
        "Heading2": styles.topLevelElement("h2"),
        "Heading3": styles.topLevelElement("h3"),
        "Heading4": styles.topLevelElement("h4")
    }
};

function Converter(options) {
    this._documentConverter = new DocumentConverter(options);
}

Converter.prototype.convertToHtml = function(docxFile) {
    var documentConverter = this._documentConverter;
    return docxReader.read(docxFile)
        .then(function(result) {
            return documentConverter.convertToHtml(result.document);
        });
}
