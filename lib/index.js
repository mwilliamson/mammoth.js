var q = require("q");
var _ = require("underscore");
var ZipFile = require("zipfile").ZipFile;

var docxReader = require("./docx-reader");
var documents = require("./documents");
var styles = require("./styles");

exports.Converter = Converter;
exports.standardOptions = {
    styleMap: {
        "Heading1": styles.topLevelElement("h1"),
        "Heading2": styles.topLevelElement("h2"),
        "Heading3": styles.topLevelElement("h3"),
        "Heading4": styles.topLevelElement("h4")
    }
};

function Converter(options) {
    this._documentConverter = new documents.DocumentConverter(options);
}

Converter.prototype.convertToHtml = function(docxFile) {
    var documentConverter = this._documentConverter;
    return docxReader.read(docxFile)
        .then(function(document) {
            return documentConverter.convertToHtml(document);
        });
}
