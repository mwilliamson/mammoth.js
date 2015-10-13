var async = require("async");
var _ = require("underscore");

var promises = require("./promises");
var documents = require("./documents");
var htmlPaths = require("./html-paths");
var results = require("./results");
var images = require("./images");
var Html = require("./html");
var writers = require("./writers");

exports.DocumentConverter = DocumentConverter;


// TODO: investigate tidier solutions
if (typeof setImmediate === "undefined") {
    var setImmediate = function(callback) {
        setTimeout(callback, 0);
    };
}


function DocumentConverter(options) {
    return {
        convertToHtml: function() {
            var conversion = new DocumentConversion(options);
            return conversion.convertToHtml.apply(this, arguments);
        }
    };
}

function DocumentConversion(options) {
    var noteNumber = 1;
    
    var noteReferences = [];
    
    options = _.extend({ignoreEmptyParagraphs: true}, options);
    var idPrefix = options.idPrefix === undefined ?
        Math.floor(Math.random() * 1000000000000000) :
        options.idPrefix;
    
    var defaultParagraphStyle = htmlPaths.topLevelElement("p");
    
    var styleMap = options.styleMap || [];
    
    function convertToHtml(document) {
        var messages = [];
        
        return promises.nfcall(elementToHtml, document, messages).then(function(html) {
            var writer = writers.writer({
                prettyPrint: options.prettyPrint,
                outputFormat: options.outputFormat
            });
            Html.write(writer, Html.simplify(html));
            return new results.Result(writer.asString(), messages);
        });
    }
    
    function convertElements(elements, messages, callback) {
        async.mapSeries(elements, function(element, callback) {
            return elementToHtml(element, messages, callback);
        }, callback);
    }

    function elementToHtml(element, messages, callback) {
        var handler = elementConverters[element.type];
        if (handler) {
            handler(element, messages, callback);
        } else {
            callback();
        }
    }
    
    function convertParagraph(element, messages, callback) {
        var style = styleForParagraph(element, messages);
        
        setImmediate(function() {
            convertElements(element.children, messages, function(error, children) {
                if (!options.ignoreEmptyParagraphs) {
                    children = [Html.forceWrite, Html.fragment(children)];
                }
                callback(null, Html.pathToNode(style, children));
            });
        });
    }
    
    function styleForParagraph(element, messages) {
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
    
    function convertRun(run, messages, callback) {
        if (run.styleId) {
            var style = findStyle(run);
            if (!style) {
                messages.push(unrecognisedStyleWarning("run", run));
            }
        }
        convertElements(run.children, messages, function(error, children) {
            var result = Html.fragment(children);
            if (run.isStrikethrough) {
                result = convertStrikethrough(result);
            }
            if (run.isUnderline) {
                result = convertUnderline(result);
            }
            if (run.verticalAlignment === documents.verticalAlignment.subscript) {
                result = wrap(result, "sub");
            }
            if (run.verticalAlignment === documents.verticalAlignment.superscript) {
                result = wrap(result, "sup");
            }
            if (run.isItalic) {
                result = wrap(result, "em");
            }
            if (run.isBold) {
                result = wrap(result, "strong");
            }
            if (style) {
                result = Html.pathToNode(style.to, [result]);
            }
            callback(null, result);
        });
    }
    
    function wrap(node, tagName) {
        return Html.elementWithTag(htmlPaths.element(tagName, {}, {fresh: false}), [node]);
    }
    
    function convertUnderline(runHtml) {
        return (options.convertUnderline || defaultConvertUnderline)(runHtml);
    }
    
    function convertStrikethrough(result) {
        var style = findStyle({type: "strikethrough"});
        if (style) {
            return Html.pathToNode(style.to, [result]);
        } else {
            return wrap(result, "s");
        }
    }
    
    function defaultConvertUnderline(runHtml) {
        var style = findStyle({type: "underline"});
        if (style) {
            return Html.pathToNode(style.to, [runHtml]);
        } else {
            return runHtml;
        }
    }
    
    function findStyle(element) {
        for (var i = 0; i < styleMap.length; i++) {
            if (styleMap[i].from.matches(element)) {
                return styleMap[i];
            }
        }
    }
    
    var defaultConvertImage = images.inline(function(element) {
        return element.read("base64").then(function(imageBuffer) {
            return {
                src: "data:" + element.contentType + ";base64," + imageBuffer
            };
        });
    });
    
    function recoveringConvertImage(convertImage) {
        return function(image, messages, callback) {
            convertImage(image, messages, function(error, result) {
                if (error) {
                    messages.push(results.warning(error.message));
                    callback(null, Html.fragment());
                } else {
                    callback(null, result);
                }
            });
        };
    }

    function noteHtmlId(note) {
        return htmlId(note.noteType + "-" + note.noteId);
    }
    
    function noteRefHtmlId(note) {
        return htmlId(note.noteType + "-ref-" + note.noteId);
    }
    
    function htmlId(suffix) {
        return idPrefix + "-" + suffix;
    }
    
    function convertTable(element, messages, callback) {
        wrapChildren(element, "table", messages, callback);
    }
    
    function convertTableRow(element, messages, callback) {
        wrapChildren(element, "tr", messages, callback);
    }
    
    function convertTableCell(element, messages, callback) {
        wrapChildren(element, "td", messages, callback);
    }
    
    function wrapChildren(element, wrapElementName, messages, callback) {
        convertElements(element.children, messages, function(error, children) {
            callback(null, Html.element(wrapElementName, {}, [
                Html.forceWrite,
                Html.fragment(children)]));
        });
    }

    var elementConverters = {
        "document": function(document, messages, callback) {
            convertElements(document.children, messages, function(error, children) {
                var notes = noteReferences.map(function(noteReference) {
                    return document.notes.resolve(noteReference);
                });
                convertElements(notes, messages, function(error, notesNodes) {
                    callback(null, Html.fragment([
                        Html.fragment(children),
                        Html.element("ol", {}, notesNodes)]));
                });
            });
        },
        "paragraph": convertParagraph,
        "run": convertRun,
        "text": function(element, messages, callback) {
            callback(null, Html.text(element.value));
        },
        "tab": function(element, messages, callback) {
            callback(null, Html.text("\t"));
        },
        "hyperlink": function(element, messages, callback) {
            var href = element.anchor ? "#" + htmlId(element.anchor) : element.href;

            convertElements(element.children, messages, function(error, children) {
                callback(null, Html.element("a", {href: href}, children));
            });
        },
        "bookmarkStart": function(element, messages, callback) {
            callback(null, Html.element("a", {
                id: htmlId(element.name)
            }, [Html.forceWrite]));
        },
        "noteReference": function(element, messages, callback) {
            noteReferences.push(element);
            
            callback(null, Html.element("sup", {}, [
                Html.element("a", {
                    href: "#" + noteHtmlId(element),
                    id: noteRefHtmlId(element)
                }, [Html.text("[" + (noteNumber++) + "]")])
            ]));
        },
        "note": function(element, messages, callback) {
            convertElements(element.body, messages, function(error, children) {
                callback(null, Html.element("li", {id: noteHtmlId(element)}, [
                    Html.fragment(children),
                    
                    Html.elementWithTag(htmlPaths.element("p", {}, {fresh: false}), [
                        Html.text(" "),
                        Html.element("a", {href: "#" + noteRefHtmlId(element)}, [Html.text("↑")]),
                        
                    ])
                ]));
            });
        },
        "image": recoveringConvertImage(options.convertImage || defaultConvertImage),
        "table": convertTable,
        "tableRow": convertTableRow,
        "tableCell": convertTableCell,
        "lineBreak": function(element, messages, callback) {
            callback(null, Html.selfClosingElement("br"));
        }
    };
    return {
        convertToHtml: convertToHtml
    };
}

function unrecognisedStyleWarning(type, element) {
    return results.warning(
        "Unrecognised " + type + " style: '" + element.styleName + "'" +
        " (Style ID: " + element.styleId + ")"
    );
}
