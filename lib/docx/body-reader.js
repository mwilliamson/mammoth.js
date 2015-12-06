exports.BodyReader = BodyReader;

var _ = require("underscore");

var documents = require("../documents");
var Result = require("../results").Result;
var warning = require("../results").warning;


function BodyReader(options) {
    var relationships = options.relationships;
    var contentTypes = options.contentTypes;
    var docxFile = options.docxFile;
    var files = options.files;
    var numbering = options.numbering;
    var styles = options.styles;

    function readXmlElements(elements) {
        var results = elements.map(readXmlElement);
        return combineResults(results);
    }

    function readXmlElement(element) {
        if (element.type === "element") {
            var handler = xmlElementReaders[element.name];
            if (handler) {
                return handler(element);
            } else if (!Object.prototype.hasOwnProperty.call(ignoreElements, element.name)) {
                var message = warning("An unrecognised element was ignored: " + element.name);
                return emptyResultWithMessages([message]);
            }
        }
        return emptyResult();
    }
    
    function readRunProperties(element) {
        var properties = {
            type: "runProperties"
        };
        
        readRunStyle(properties, element);
        
        var verticalAlignmentElement = element.first("w:vertAlign");
        if (verticalAlignmentElement) {
            properties.verticalAlignment = verticalAlignmentElement.attributes["w:val"];
        }
        
        properties.isBold = !!element.first("w:b");
        properties.isUnderline = !!element.first("w:u");
        properties.isItalic = !!element.first("w:i");
        properties.isStrikethrough = !!element.first("w:strike");
        
        return elementResult(properties);
    }
    
    function readRunStyle(properties, element) {
        var styleElement = element.first("w:rStyle");
        if (styleElement) {
            var styleId = styleElement.attributes["w:val"];
            properties.styleId = styleId;
            if (styleId) {
                var style = styles.findCharacterStyleById(styleId);
                properties.styleName = style.name;
            }
        }
    }
    
    function noteReferenceReader(noteType) {
        return function(element) {
            var noteId = element.attributes["w:id"];
            return elementResult(new documents.NoteReference({
                noteType: noteType,
                noteId: noteId
            }));
        };
    }
    
    function readChildElements(element) {
        return readXmlElements(element.children);
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
                })
                .insertExtra();
        },
        "w:pPr": function(element) {
            var properties = {
                type: "paragraphProperties"
            };
            
            var styleElement = element.first("w:pStyle");
            if (styleElement) {
                var styleId = styleElement.attributes["w:val"];
                properties.styleId = styleId;
                if (styleId) {
                    var style = styles.findParagraphStyleById(styleId);
                    properties.styleName = style.name;
                }
            }
            var alignElement = element.first("w:jc");
            if (alignElement) {
                properties.alignment = alignElement.attributes["w:val"];
            }
            properties.numbering = readNumberingProperties(element.firstOrEmpty("w:numPr"));
            
            return elementResult(properties);
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
        "w:rPr": readRunProperties,
        "w:t": function(element) {
            return elementResult(new documents.Text(element.text()));
        },
        "w:tab": function(element) {
            return elementResult(new documents.Tab());
        },
        "w:hyperlink": function(element) {
            var relationshipId = element.attributes["r:id"];
            var anchor = element.attributes["w:anchor"];
            return readXmlElements(element.children).map(function(children) {
                if (relationshipId) {
                    var href = relationships[relationshipId].target;
                    return new documents.Hyperlink(children, {href: href});
                } else if (anchor) {
                    return new documents.Hyperlink(children, {anchor: anchor});
                } else {
                    return children;
                }
            });
        },
        "w:tbl": function(element) {
            return readXmlElements(element.children).map(documents.Table);
        },
        "w:tr": function(element) {
            return readXmlElements(element.children).map(documents.TableRow);
        },
        "w:tc": function(element) {
            return readXmlElements(element.children).map(documents.TableCell);
        },
        "w:footnoteReference": noteReferenceReader("footnote"),
        "w:endnoteReference": noteReferenceReader("endnote"),
        "w:br": function(element) {
            var breakType = element.attributes["w:type"];
            if (breakType) {
                return emptyResultWithMessages([warning("Unsupported break type: " + breakType)]);
            } else {
                return elementResult(new documents.LineBreak());
            }
        },
        "w:bookmarkStart": function(element){
            var name = element.attributes["w:name"];
            if (name === "_GoBack") {
                return emptyResult();
            } else {
                return elementResult(new documents.BookmarkStart({name: name}));
            }
        },
        
        "mc:AlternateContent": function(element) {
            return readChildElements(element.first("mc:Fallback"));
        },

        "w:ins": readChildElements,
        "w:smartTag": readChildElements,
        "w:drawing": readChildElements,
        "w:pict": function(element) {
            return readChildElements(element).toExtra();
        },
        "v:roundrect": readChildElements,
        "v:shape": readChildElements,
        "v:textbox": readChildElements,
        "w:txbxContent": readChildElements,
        "wp:inline": readDrawingElement,
        "wp:anchor": readDrawingElement,
        "v:imagedata": readImageData
    };
    return {
        readXmlElement: readXmlElement,
        readXmlElements: readXmlElements,
        _readNumberingProperties: readNumberingProperties
    };

    function readNumberingProperties(element) {
        var level = element.firstOrEmpty("w:ilvl").attributes["w:val"];
        var numId = element.firstOrEmpty("w:numId").attributes["w:val"];
        if (level === undefined || numId === undefined) {
            return null;
        } else {
            return numbering.findLevel(numId, level);
        }
    }

    function readDrawingElement(element) {
        var blips = element
            .getElementsByTagName("a:graphic")
            .getElementsByTagName("a:graphicData")
            .getElementsByTagName("pic:pic")
            .getElementsByTagName("pic:blipFill")
            .getElementsByTagName("a:blip");
        
        return combineResults(blips.map(readBlip.bind(null, element)));
    }
    
    function readBlip(element, blip) {
        var altText = element.first("wp:docPr").attributes.descr;
        return readImage(findBlipImageFile(blip), altText);
    }
    
    function findBlipImageFile(blip) {
        var embedRelationshipId = blip.attributes["r:embed"];
        var linkRelationshipid = blip.attributes["r:link"];
        if (embedRelationshipId) {
            return findEmbeddedImageFile(embedRelationshipId);
        } else {
            var imagePath = relationships[linkRelationshipid].target;
            return {
                path: imagePath,
                read: files.read.bind(files, imagePath)
            };
        }
    }
    
    function readImageData(element) {
        return readImage(
            findEmbeddedImageFile(element.attributes["r:id"]),
            element.attributes["o:title"]);
    }
    
    function findEmbeddedImageFile(relationshipId) {
        var path = joinZipPath("word", relationships[relationshipId].target);
        return {
            path: path,
            read: docxFile.read.bind(docxFile, path)
        };
    }
    
    function readImage(imageFile, altText) {
        var contentType = contentTypes.findContentType(imageFile.path);
        
        var image = documents.Image({
            readImage: imageFile.read,
            altText: altText,
            contentType: contentType
        });
        var warnings = supportedImageTypes[contentType] ?
            [] : warning("Image of type " + contentType + " is unlikely to display in web browsers");
        return elementResultWithMessages(image, warnings);
    }
}
    
var supportedImageTypes = {
    "image/png": true,
    "image/gif": true,
    "image/jpeg": true,
    "image/svg+xml": true,
    "image/tiff": true
};

var ignoreElements = {
    "office-word:wrap": true,
    "v:shadow": true,
    "v:shapetype": true,
    "w:bookmarkEnd": true,
    "w:sectPr": true,
    "w:proofErr": true,
    "w:lastRenderedPageBreak": true,
    "w:commentRangeStart": true,
    "w:commentRangeEnd": true,
    "w:commentReference": true,
    "w:del": true,
    "w:footnoteRef": true,
    "w:endnoteRef": true,
    "w:tblPr": true,
    "w:tblGrid": true,
    "w:tcPr": true
};

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

function joinZipPath(first, second) {
    // In general, we should check first and second for trailing and leading slashes,
    // but in our specific case this seems to be sufficient
    return first + "/" + second;
}



function emptyResultWithMessages(messages) {
    return new ReadResult(null, null, messages);
}

function emptyResult() {
    return new ReadResult(null);
}

function elementResult(element) {
    return new ReadResult(element);
}

function elementResultWithMessages(element, messages) {
    return new ReadResult(element, null, messages);
}

function ReadResult(element, extra, messages) {
    this.value = element || [];
    this.extra = extra;
    this._result = new Result({
        element: this.value,
        extra: extra
    }, messages);
    this.messages = this._result.messages;
}

ReadResult.prototype.toExtra = function() {
    return new ReadResult(null, joinElements(this.extra, this.value), this.messages);
};

ReadResult.prototype.insertExtra = function() {
    var extra = this.extra;
    if (extra && extra.length) {
        return new ReadResult(joinElements(this.value, extra), null, this.messages);
    } else {
        return this;
    }
};

ReadResult.prototype.map = function(func) {
    var result = this._result.map(function(value) {
        return func(value.element);
    });
    return new ReadResult(result.value, this.extra, result.messages);
};

ReadResult.prototype.flatMap = function(func) {
    var result = this._result.flatMap(function(value) {
        return func(value.element)._result;
    });
    return new ReadResult(result.value.element, joinElements(this.extra, result.value.extra), result.messages);
};

function combineResults(results) {
    var result = Result.combine(_.pluck(results, "_result"));
    return new ReadResult(
        _.flatten(_.pluck(result.value, "element")),
        _.filter(_.flatten(_.pluck(result.value, "extra")), function(x) { return x; }),
        result.messages
    );
}

function joinElements(first, second) {
    return _.flatten([first, second]);
}
