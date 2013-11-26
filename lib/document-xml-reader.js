exports.DocumentXmlReader = DocumentXmlReader;

var q = require("q");
var _ = require("underscore");
var path = require("path");

var documents = require("./documents");
var Result = require("./results").Result;
var warning = require("./results").warning;


function DocumentXmlReader(relationships, contentTypes, docxFile, numbering) {
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
            var numberingPropertiesElement = element.first("w:numPr");
            if (numberingPropertiesElement) {
                var levelElement = numberingPropertiesElement.first("w:ilvl");
                var level = levelElement.attributes["w:val"];
                var numId = numberingPropertiesElement.first("w:numId").attributes["w:val"];
                properties.numbering = numbering.findLevel(numId, level);
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
        "w:tab": function(element) {
            return new Result(new documents.Tab());
        },
        "w:hyperlink": function(element) {
            var relationshipId = element.attributes["r:id"];
            return readXmlElements(element.children).map(function(children) {
                if (relationshipId) {
                    var href = relationships[relationshipId].target;
                    return new documents.Hyperlink(children, {href: href});
                } else {
                    return children;
                }
            });
        },
        
        "w:ins": function(element) {
            return readXmlElements(element.children);
        },
        
        "w:drawing": function(element) {
            return readXmlElements(element.children);
        },
        "wp:inline": readDrawingElement,
        "wp:anchor": readDrawingElement
    };
    return {
        convertXmlToDocument: convertXmlToDocument,
        readXmlElement: readXmlElement
    };

    function readDrawingElement(element) {
        var blips = element
            .getElementsByTagName("a:graphic")
            .getElementsByTagName("a:graphicData")
            .getElementsByTagName("pic:pic")
            .getElementsByTagName("pic:blipFill")
            .getElementsByTagName("a:blip");
        
        var results = blips.map(function(blip) {
            var relationshipId = blip.attributes["r:embed"];
            var imagePath = path.join("word", relationships[relationshipId].target);
            var readImage = docxFile.read.bind(docxFile, imagePath);
            var altText = element.first("wp:docPr").attributes.descr;
            
            var image = documents.Image({
                readImage: readImage,
                altText: altText,
                contentType: contentTypes.findContentType(imagePath)
            });
            return new Result(image);
        });
        
        return Result.combine(results);
    }
}

var ignoreElements = {
    "w:bookmarkStart": true,
    "w:bookmarkEnd": true,
    "w:sectPr": true,
    "w:proofErr": true,
    "w:lastRenderedPageBreak": true,
    "w:commentRangeStart": true,
    "w:commentRangeEnd": true,
    "w:commentReference": true,
    "w:del": true
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
