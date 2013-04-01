exports.read = read;
exports.DocumentReader = DocumentReader;

var q = require("q");
var _ = require("underscore");
var ZipFile = require("zipfile").ZipFile;

var xmlreader = require("./xmlreader");
var documents = require("./documents");


function read(docxFile) {
    if (_.isString(docxFile)) {
        var zipFile = new ZipFile(docxFile);
        docxFile = {
            read: function(path, encoding) {
                return q.ninvoke(zipFile, "readFile", path)
                    .then(function(value) {
                        if (encoding) {
                            return value;
                        } else {
                            return value.toString(encoding);
                        }
                    });
            },
            exists: function(path) {
                return zipFile.names.indexOf(path) !== -1;
            }
        };
    }
    
    return q.all([
        readXmlFile(docxFile, "word/_rels/document.xml.rels"),
        readXmlFile(docxFile, "word/document.xml")
    ]).spread(function(relationshipsXml, documentXml) {
        var relationships = relationshipsXml ? readRelationships(relationshipsXml) : {};
        var reader = new DocumentReader(relationships, docxFile);
        return reader.convertXmlToDocument(documentXml);
    });
}

function readXmlFile(docxFile, path) {
    if (docxFile.exists(path)) {
        return docxFile.read(path)
            .then(xmlreader.read);
    } else {
        return null;
    }
}

function readRelationships(relationshipsXml) {
    var relationships = {};
    relationshipsXml.root.children.forEach(function(child) {
        if (child.name === "Relationship") {
            relationships[child.attributes.Id] = {
                target: child.attributes.Target
            };
        }
    });
    return relationships;
}

function DocumentReader(relationships, docxFile) {
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
        var messages = _.flatten(_.pluck(results, "messages"), true);
        return new Result(values, messages);
    }

    function readXmlElement(element) {
        if (element.type === "element") {
            var handler = xmlElementReaders[element.name];
            if (handler) {
                return handler(element);
            } else if (!Object.prototype.hasOwnProperty.call(ignoreElements, element.name)) {
                return new Result(
                    null,
                    [warning("An unrecognised element was ignored: " + element.name)]
                );
            }
        }
        return new Result(null);
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
        },
        "w:hyperlink": function(element) {
            var relationshipId = element.attributes["r:id"];
            var href = relationships[relationshipId].target;
            return readXmlElements(element.children)
                .map(function(children) {
                    return new documents.Hyperlink(children, {href: href});
                });
        },
        
        "w:drawing": function(element) {
            return readXmlElement(element.first("wp:inline"));
        },
        "wp:inline": function(element) {
            var relationshipId = element
                .first("a:graphic")
                .first("a:graphicData")
                .first("pic:pic")
                .first("pic:blipFill")
                .first("a:blip")
                .attributes["r:embed"];
            var imagePath = relationships[relationshipId].target;
            var image = documents.Image(function() {
                return docxFile.read(imagePath);
            })
            return new Result(image);
        }
    };
    return {
        convertXmlToDocument: convertXmlToDocument,
        readXmlElement: readXmlElement
    };
}

var ignoreElements = {
    "w:bookmarkStart": true,
    "w:bookmarkEnd": true,
    "w:sectPr": true,
    "w:proofErr": true,
    "w:lastRenderedPageBreak": true
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

Result.prototype.mapThen = function(func) {
    var messages = this.messages;
    return func(this.value).then(function(resultValue) {
        return new Result(resultValue, messages);
    });
};

function warning(message) {
    return {
        type: "warning",
        message: message
    };
}
