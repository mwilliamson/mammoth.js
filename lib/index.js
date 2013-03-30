var q = require("q");
var _ = require("underscore");
var ZipFile = require("zipfile").ZipFile;

var xmlreader = require("./xmlreader");
var documents = require("./documents");
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
    this._documentConverter = new documents.DocumentConverter(options);
}

Converter.prototype.convertToHtml = function(docxFile) {
    if (_.isString(docxFile)) {
        var zipFile = new ZipFile(docxFile);
        docxFile = {
            read: function(path) {
                return q.ninvoke(zipFile, "readFile", path, "utf-8")
                    .then(function(value) {
                        return value.toString();
                    });
            }
        };
    }
    
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
