var q = require("q");
var xmlreader = require("./xmlreader");

var documents = require("./documents");

exports.Converter = Converter;

function Converter() {
    this._documentConverter = new documents.DocumentConverter();
}

Converter.prototype.convertToHtml = function(docxFile) {
    var documentConverter = this._documentConverter;
    return docxFile.read("word/document.xml").then(function(documentXmlString) {
        return parseXml(documentXmlString);
    }).then(function(documentXml) {
        return documentConverter.convertToHtml(documentXml);
    });
}

function parseXml(string) {
    return xmlreader.read(string);
}
