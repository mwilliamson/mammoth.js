var _ = require("underscore");

var promises = require("./promises");
var documents = require("./documents");
var htmlPaths = require("./styles/html-paths");
var results = require("./results");
var images = require("./images");
var Html = require("./html");
var writers = require("./writers");

exports.DocumentConverter = DocumentConverter;


function DocumentConverter(options) {
    return {
        convertToHtml: function(element) {
            var comments = _.indexBy(
                element.type === documents.types.document ? element.comments : [],
                "commentId"
            );
            var conversion = new DocumentConversion(options, comments);
            return conversion.convertToHtml(element);
        }
    };
}

function DocumentConversion(options, comments) {
    var noteNumber = 1;
    
    var noteReferences = [];
    
    var referencedComments = [];
    
    options = _.extend({ignoreEmptyParagraphs: true}, options);
    var idPrefix = options.idPrefix === undefined ? "" : options.idPrefix;
    
    var defaultParagraphStyle = htmlPaths.topLevelElement("p");
    
    var styleMap = options.styleMap || [];
    
    function convertToHtml(document) {
        var messages = [];
        
        var html = elementToHtml(document, messages);
        
        var deferredNodes = [];
        walkHtml(html, function(node) {
            if (node.type === "deferred") {
                deferredNodes.push(node);
            }
        });
        var deferredValues = {};
        return promises.mapSeries(deferredNodes, function(deferred) {
            return deferred.value().then(function(value) {
                deferredValues[deferred.id] = value;
            });
        }).then(function() {
            function replaceDeferred(nodes) {
                return flatMap(nodes, function(node) {
                    if (node.type === "deferred") {
                        return deferredValues[node.id];
                    } else if (node.children) {
                        return [
                            _.extend({}, node, {
                                children: replaceDeferred(node.children)
                            })
                        ];
                    } else {
                        return [node];
                    }
                });
            }
            var writer = writers.writer({
                prettyPrint: options.prettyPrint,
                outputFormat: options.outputFormat
            });
            Html.write(writer, Html.simplify(replaceDeferred(html)));
            return new results.Result(writer.asString(), messages);
        });
    }
    
    function convertElements(elements, messages) {
        return flatMap(elements, function(element) {
            return elementToHtml(element, messages);
        });
    }

    function elementToHtml(element, messages) {
        var handler = elementConverters[element.type];
        if (handler) {
            return handler(element, messages);
        } else {
            return [];
        }
    }
    
    function convertParagraph(element, messages) {
        return htmlPathForParagraph(element, messages).wrap(function() {
            var content = convertElements(element.children, messages);
            if (options.ignoreEmptyParagraphs) {
                return content;
            } else {
                return [Html.forceWrite].concat(content);
            }
        });
    }
    
    function htmlPathForParagraph(element, messages) {
        var style = findStyle(element);
        
        if (style) {
            return style.to;
        } else {
            if (element.styleId) {
                messages.push(unrecognisedStyleWarning("paragraph", element));
            }
            return defaultParagraphStyle;
        }
    }
    
    function convertRun(run, messages) {
        var nodes = function() {
            return convertElements(run.children, messages);
        };
        var paths = [];
        if (run.isStrikethrough) {
            paths.push(findHtmlPathForRunProperty("strikethrough", "s"));
        }
        if (run.isUnderline) {
            paths.push(findHtmlPathForRunProperty("underline"));
        }
        if (run.verticalAlignment === documents.verticalAlignment.subscript) {
            paths.push(htmlPaths.element("sub", {}, {fresh: false}));
        }
        if (run.verticalAlignment === documents.verticalAlignment.superscript) {
            paths.push(htmlPaths.element("sup", {}, {fresh: false}));
        }
        if (run.isItalic) {
            paths.push(findHtmlPathForRunProperty("italic", "em"));
        }
        if (run.isBold) {
            paths.push(findHtmlPathForRunProperty("bold", "strong"));
        }
        var stylePath = htmlPaths.empty;
        var style = findStyle(run);
        if (style) {
            stylePath = style.to;
        } else if (run.styleId) {
            messages.push(unrecognisedStyleWarning("run", run));
        }
        paths.push(stylePath);
            
        paths.forEach(function(path) {
            nodes = path.wrap.bind(path, nodes);
        });
        
        return nodes();
    }
    
    function findHtmlPathForRunProperty(elementType, defaultTagName) {
        var path = findHtmlPath({type: elementType});
        if (path) {
            return path;
        } else if (defaultTagName) {
            return htmlPaths.element(defaultTagName, {}, {fresh: false});
        } else {
            return htmlPaths.empty;
        }
    }
    
    function findHtmlPath(element, defaultPath) {
        var style = findStyle(element);
        return style ? style.to : defaultPath;
    }
    
    function findStyle(element) {
        for (var i = 0; i < styleMap.length; i++) {
            if (styleMap[i].from.matches(element)) {
                return styleMap[i];
            }
        }
    }
    
    var defaultConvertImage = images.imgElement(function(element) {
        return element.read("base64").then(function(imageBuffer) {
            return {
                src: "data:" + element.contentType + ";base64," + imageBuffer
            };
        });
    });
    
    function recoveringConvertImage(convertImage) {
        return function(image, messages) {
            return promises.attempt(function() {
                return convertImage(image, messages);
            }).caught(function(error) {
                messages.push(results.error(error));
                return [];
            });
        };
    }

    function noteHtmlId(note) {
        return referentHtmlId(note.noteType, note.noteId);
    }
    
    function noteRefHtmlId(note) {
        return referenceHtmlId(note.noteType, note.noteId);
    }
    
    function referentHtmlId(referenceType, referenceId) {
        return htmlId(referenceType + "-" + referenceId);
    }
    
    function referenceHtmlId(referenceType, referenceId) {
        return htmlId(referenceType + "-ref-" + referenceId);
    }
    
    function htmlId(suffix) {
        return idPrefix + suffix;
    }
    
    function convertTable(element, messages) {
        return wrapChildrenInFreshElement(element, "table", messages);
    }
    
    function convertTableRow(element, messages) {
        return wrapChildrenInFreshElement(element, "tr", messages);
    }
    
    function convertTableCell(element, messages) {
        var children = convertElements(element.children, messages);
        var attributes = {};
        if (element.colSpan !== 1) {
            attributes.colspan = element.colSpan.toString();
        }
        if (element.rowSpan !== 1) {
            attributes.rowspan = element.rowSpan.toString();
        }
            
        return [
            Html.freshElement("td", attributes, [Html.forceWrite].concat(children))
        ];
    }
    
    function convertCommentReference(reference, messages) {
        return findHtmlPath(reference, htmlPaths.ignore).wrap(function() {
            var comment = comments[reference.commentId];
            var count = referencedComments.length + 1;
            var label = "[" + commentAuthorLabel(comment) + count + "]";
            referencedComments.push({label: label, comment: comment});
            // TODO: remove duplication with note references
            return [
                Html.freshElement("a", {
                    href: "#" + referentHtmlId("comment", reference.commentId),
                    id: referenceHtmlId("comment", reference.commentId)
                }, [Html.text(label)])
            ];
        });
    }
    
    function convertComment(referencedComment, messages) {
        // TODO: remove duplication with note references
        
        var label = referencedComment.label;
        var comment = referencedComment.comment;
        var body = convertElements(comment.body).concat([
            Html.nonFreshElement("p", {}, [
                Html.text(" "),
                Html.freshElement("a", {"href": "#" + referenceHtmlId("comment", comment.commentId)}, [
                    Html.text("↑")
                ])
            ])
        ]);
        
        return [
            Html.freshElement(
                "dt",
                {"id": referentHtmlId("comment", comment.commentId)},
                [Html.text("Comment " + label)]
            ),
            Html.freshElement("dd", {}, body)
        ];
    }
    
    function convertBreak(element, messages) {
        return htmlPathForBreak(element).wrap(function() {
            return [];
        });
    }
    
    function htmlPathForBreak(element) {
        var style = findStyle(element);
        if (style) {
            return style.to;
        } else if (element.breakType === "line") {
            return htmlPaths.topLevelElement("br");
        } else {
            return htmlPaths.empty;
        }
    }
    
    function wrapChildrenInFreshElement(element, wrapElementName, messages) {
        var children = convertElements(element.children, messages);
        return [
            Html.freshElement(wrapElementName, {}, [Html.forceWrite].concat(children))
        ];
    }

    var elementConverters = {
        "document": function(document, messages) {
            var children = convertElements(document.children, messages);
            var notes = noteReferences.map(function(noteReference) {
                return document.notes.resolve(noteReference);
            });
            var notesNodes = convertElements(notes, messages);
            return children.concat([
                Html.freshElement("ol", {}, notesNodes),
                Html.freshElement("dl", {}, flatMap(referencedComments, function(referencedComment) {
                    return convertComment(referencedComment, messages);
                }))
            ]);
        },
        "paragraph": convertParagraph,
        "run": convertRun,
        "text": function(element, messages) {
            return [Html.text(element.value)];
        },
        "tab": function(element, messages) {
            return [Html.text("\t")];
        },
        "hyperlink": function(element, messages) {
            var href = element.anchor ? "#" + htmlId(element.anchor) : element.href;

            var children = convertElements(element.children, messages);
            return [Html.freshElement("a", {href: href}, children)];
        },
        "bookmarkStart": function(element, messages) {
            var anchor = Html.freshElement("a", {
                id: htmlId(element.name)
            }, [Html.forceWrite]);
            return [anchor];
        },
        "noteReference": function(element, messages) {
            noteReferences.push(element);
            var anchor = Html.freshElement("a", {
                href: "#" + noteHtmlId(element),
                id: noteRefHtmlId(element)
            }, [Html.text("[" + (noteNumber++) + "]")]);
            
            return [Html.freshElement("sup", {}, [anchor])];
        },
        "note": function(element, messages) {
            var children = convertElements(element.body, messages);
            var backLink = Html.elementWithTag(htmlPaths.element("p", {}, {fresh: false}), [
                Html.text(" "),
                Html.freshElement("a", {href: "#" + noteRefHtmlId(element)}, [Html.text("↑")])
            ]);
            var body = children.concat([backLink]);
            
            return Html.freshElement("li", {id: noteHtmlId(element)}, body);
        },
        "commentReference": convertCommentReference,
        "comment": convertComment,
        "image": deferredConversion(recoveringConvertImage(options.convertImage || defaultConvertImage)),
        "table": convertTable,
        "tableRow": convertTableRow,
        "tableCell": convertTableCell,
        "break": convertBreak
    };
    return {
        convertToHtml: convertToHtml
    };
}

var deferredId = 1;

function deferredConversion(func) {
    return function(element, messages) {
        return [
            {
                type: "deferred",
                id: deferredId++,
                value: function() {
                    return func(element, messages);
                }
            }
        ];
    };
}

function unrecognisedStyleWarning(type, element) {
    return results.warning(
        "Unrecognised " + type + " style: '" + element.styleName + "'" +
        " (Style ID: " + element.styleId + ")"
    );
}

function flatMap(values, func) {
    return _.flatten(values.map(func), true);
}

function walkHtml(nodes, callback) {
    nodes.forEach(function(node) {
        callback(node);
        if (node.children) {
            walkHtml(node.children, callback);
        }
    });
}

var commentAuthorLabel = exports.commentAuthorLabel = function commentAuthorLabel(comment) {
    return comment.authorInitials || "";
};
