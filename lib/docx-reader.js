exports.read = read;
exports.readXmlElement = readXmlElement;

var q = require("q");
var _ = require("underscore");
var ZipFile = require("zipfile").ZipFile;

var xmlreader = require("./xmlreader");
var documents = require("./documents");


function read(docxFile) {
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
    
    return docxFile.read("word/document.xml")
        .then(xmlreader.read)
        .then(convertXmlToDocument);
}

function convertXmlToDocument(documentXml) {
    var body = documentXml.root.first("w:body");
    
    var result = readXmlElements(body.children)
        .map(function(children) {
            return new documents.Document(children);
        });
    result.document = result.value;
    return result;
}

function readXmlElements(elements) {
    var results = elements.map(readXmlElement);
    var values = _.pluck(results, "value").filter(notNull);
    var messages = _.pluck(results, "messages");
    return new Result(values, messages);
}

function readXmlElement(element) {
    if (element.type === "element") {
        var handler = xmlElementReaders[element.name];
        if (handler) {
            return handler(element);
        } else {
            return new Result(
                null,
                [warning("An unrecognised element was ignored: " + element.name)]
            );
        }
    } else {
        return new Result(null);
    }
}

var xmlElementReaders = {
    "w:p": function(element) {
        return readXmlElements(element.children)
            .map(function(children) {
                var properties = _.find(children, isParagraphProperties);
                
                return new documents.Paragraph(
                    children.filter(negate(isParagraphProperties)),
                    properties
                );
            });
    },
    "w:pPr": function(element) {
        var properties = {
            type: "paragraphProperties"
        };
        
        var styleElement = element.first("w:pStyle");
        if (styleElement) {
            properties.styleName = styleElement.attributes["w:val"];
        }
        
        return new Result(properties);
    },
    "w:r": function(element) {
        return readXmlElements(element.children)
            .map(function(children) {
                var properties = _.find(children, isRunProperties);
                
                return new documents.Run(
                    children.filter(negate(isRunProperties)),
                    properties
                );
            });
    },
    "w:rPr": function(element) {
        var properties = {
            type: "runProperties"
        };
        
        var styleElement = element.first("w:rStyle");
        if (styleElement) {
            properties.styleName = styleElement.attributes["w:val"];
        }
        properties.isBold = !!element.first("w:b");
        properties.isItalic = !!element.first("w:i");
        
        return new Result(properties);
    },
    "w:t": function(element) {
        return new Result(new documents.Text(element.children[0].value));
    }
};

function parseXml(string) {
    return xmlreader.read(string);
}

function notNull(value) {
    return value !== null;
}

function isParagraphProperties(element) {
    return element.type === "paragraphProperties";
}

function isRunProperties(element) {
    return element.type === "runProperties";
}

function negate(predicate) {
    return function(value) {
        return !predicate(value);
    };
}

function Result(value, messages) {
    this.value = value;
    this.messages = messages || [];
}

Result.prototype.map = function(func) {
    return new Result(func(this.value), this.messages);
};

function warning(message) {
    return {
        type: "warning",
        message: message
    };
}
