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
        var document = convertXmlToDocument(documentXml);
        return documentConverter.convertToHtml(document);
    });
}

function convertXmlToDocument(documentXml) {
    var body = documentXml.root.first("w:body");
    
    var children = readXmlElements(body.children);
    return new documents.Document(children);
}

function readXmlElements(elements) {
    return elements.map(readXmlElement).filter(notNull);
}

function readXmlElement(element) {
    if (element.type === "element") {
        var handler = xmlElementReaders[element.name];
        if (handler) {
            return handler(element);
        } else {
            return null;
        }
    } else {
        return null;
    }
}

var xmlElementReaders = {
    "w:p": function(element) {
        var children = readXmlElements(element.children);
        return new documents.Paragraph(children);
    },
    "w:r": function(element) {
        var children = readXmlElements(element.children);
        return new documents.Run(children);
    },
    "w:t": function(element) {
        return new documents.Text(element.children[0].value);
    }
};

function parseXml(string) {
    return xmlreader.read(string);
}

function notNull(value) {
    return value !== null;
}
