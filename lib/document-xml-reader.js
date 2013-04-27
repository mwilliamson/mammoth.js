exports.DocumentXmlReader = DocumentXmlReader;

var q = require("q");
var _ = require("underscore");
var path = require("path");

var documents = require("./documents");
var Result = require("./results").Result;
var warning = require("./results").warning;


function DocumentXmlReader(relationships, docxFile) {
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
        return Result.combine(results);
    }

    function readXmlElement(element) {
        if (element.type === "element") {
            var handler = xmlElementReaders[element.name];
            if (handler) {
                return handler(element);
            } else if (!Object.prototype.hasOwnProperty.call(ignoreElements, element.name)) {
                return new Result(
                    [],
                    [warning("An unrecognised element was ignored: " + element.name)]
                );
            }
        }
        return new Result([]);
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
            return readXmlElements(element.children);
        },
        "wp:inline": function(element) {
            var blips = element
                .getElementsByTagName("a:graphic")
                .getElementsByTagName("a:graphicData")
                .getElementsByTagName("pic:pic")
                .getElementsByTagName("pic:blipFill")
                .getElementsByTagName("a:blip");
            
            var results = blips.map(function(blip) {
                var relationshipId = blip.attributes["r:embed"];
                var imagePath = relationships[relationshipId].target;
                var readImage = docxFile.read.bind(docxFile, path.join("word", imagePath));
                var altText = element.first("wp:docPr").attributes.descr;
                
                var image = documents.Image(readImage, altText)
                return new Result(image);
            });
            
            return Result.combine(results);
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
