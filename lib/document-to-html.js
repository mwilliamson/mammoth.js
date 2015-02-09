var promises = require("./promises");
var async = require("async");

var documents = require("./documents");
var htmlPaths = require("./html-paths");
var HtmlGenerator = require("./html-generator").HtmlGenerator;
var results = require("./results");
var images = require("./images");

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
    
    options = options || {};
    var idPrefix = options.idPrefix === undefined ?
        Math.floor(Math.random() * 1000000000000000) :
        options.idPrefix;
    
    var defaultParagraphStyle = htmlPaths.topLevelElement("p");
    
    var styleMap = options.styleMap || [];
    
    function createHtmlGenerator() {
        return new HtmlGenerator({
            prettyPrint: options.prettyPrint,
            outputFormat: options.outputFormat
        });
    }
    
    function convertToHtml(document) {
        var messages = [];
        var html = createHtmlGenerator();
        
        return promises.nfcall(elementToHtml, document, html, messages).then(function() {
            html.closeAll();
            
            return new results.Result(html.asString(), messages);
        });
    }
    
    function convertElements(elements, html, messages, callback) {
        async.eachSeries(elements, function(element, callback) {
            return elementToHtml(element, html, messages, callback);
        }, callback);
    }

    function elementToHtml(element, html, messages, callback) {
        var handler = elementConverters[element.type];
        if (handler) {
            handler(element, html, messages, callback);
        } else {
            callback();
        }
    }
    
    function convertParagraph(element, html, messages, callback) {
        html.satisfyPath(styleForParagraph(element, messages));
        setImmediate(function() {
            convertElements(element.children, html, messages, callback);
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
    
    function convertRun(run, html, messages, callback) {
        var runHtml = createHtmlGenerator();
        if (run.styleId) {
            var style = findStyle(run);
            if (style) {
                runHtml.satisfyPath(style.to);
            } else {
                messages.push(unrecognisedStyleWarning("run", run));
            }
        }
        if (run.isBold) {
            runHtml.open(htmlPaths.element("strong"));
        }
        if (run.isItalic) {
            runHtml.open(htmlPaths.element("em"));
        }
        if (run.verticalAlignment === documents.verticalAlignment.superscript) {
            runHtml.open(htmlPaths.element("sup"));
        }
        if (run.verticalAlignment === documents.verticalAlignment.subscript) {
            runHtml.open(htmlPaths.element("sub"));
        }
        if (run.isUnderline && options.convertUnderline) {
            options.convertUnderline(runHtml);
        }
        convertElements(run.children, runHtml, messages, function(err) {
            if (err) {
                callback(err);
            } else {
                runHtml.closeAll();
                html.append(runHtml);
                callback();
            }
        });
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

    function noteHtmlId(note) {
        return htmlId(note.noteType + "-" + note.noteId);
    }
    
    function noteRefHtmlId(note) {
        return htmlId(note.noteType + "-ref-" + note.noteId);
    }
    
    function htmlId(suffix) {
        return idPrefix + "-" + suffix;
    }
    
    function convertTable(element, html, messages, callback) {
        html.closeAll();
        wrapChildren(element, "table", html, messages, callback);
    }
    
    function convertTableRow(element, html, messages, callback) {
        wrapChildren(element, "tr", html, messages, callback);
    }
    
    function convertTableCell(element, html, messages, callback) {
        html.open(htmlPaths.element("td"), {alwaysWrite: true});
        
        async.map(element.children, function(child, callback) {
            var cellHtml = createHtmlGenerator();
            elementToHtml(child, cellHtml, messages, function(error) {
                if (error) {
                    callback(error);
                } else {
                    cellHtml.closeAll();
                    callback(null, cellHtml);
                }
            });
        }, function(error, childrenHtml) {
            if (error) {
                callback(error);
            } else {
                childrenHtml.forEach(function(childHtml) {
                    html.append(childHtml);
                });
                html.close();
                callback();
            }
        });
    }
    
    function wrapChildren(element, wrapElementName, html, messages, callback) {
        html.open(htmlPaths.element(wrapElementName));
        convertElements(element.children, html, messages, function(err) {
            if (err) {
                callback(err);
            } else {
                html.close();
                callback();
            }
        });
    }

    var elementConverters = {
        "document": function(document, html, messages, callback) {
            convertElements(document.children, html, messages, function(error) {
                if (error) {
                    callback(error);
                } else {
                    html.closeAll();
                    html.open(htmlPaths.element("ol"));
                    var notes = noteReferences.map(function(noteReference) {
                        return document.notes.resolve(noteReference);
                    });
                    convertElements(notes, html, messages, function(error) {
                        if (error) {
                            callback(error);
                        } else {
                            html.close();
                            callback();
                        }
                    });
                }
            });
        },
        "paragraph": convertParagraph,
        "run": convertRun,
        "text": function(element, html, messages, callback) {
            html.text(element.value);
            callback();
        },
        "tab": function(element, html, messages, callback) {
            html.text("\t");
            callback();
        },
        "hyperlink": function(element, html, messages, callback) {
            var href = element.anchor ? "#" + htmlId(element.anchor) : element.href;

            html.open(htmlPaths.element("a", {href: href}));
            convertElements(element.children, html, messages, function(err) {
                if (err) {
                    callback(err);
                } else {
                    html.close();
                    callback();
                }
            });
        },
        "bookmarkStart": function(element, html, messages, callback) {
            html.open(htmlPaths.element("a", {
                id: htmlId(element.name)
            }), {alwaysWrite: true});
            html.close();
            callback();
        },
        "noteReference": function(element, html, messages, callback) {
            html.open(htmlPaths.element("sup"));
            html.open(htmlPaths.element("a", {
                href: "#" + noteHtmlId(element),
                id: noteRefHtmlId(element)
            }));
            noteReferences.push(element);
            html.text("[" + (noteNumber++) + "]");
            html.close();
            html.close();
            callback();
        },
        "note": function(element, html, messages, callback) {
            html.open(htmlPaths.element("li", {id: noteHtmlId(element)}));
            var footnoteHtml = createHtmlGenerator();
            convertElements(element.body, footnoteHtml, messages, function(err) {
                if (err) {
                    callback(err);
                } else {
                    footnoteHtml.text(" ");
                    footnoteHtml.open(htmlPaths.element("a", {href: "#" + noteRefHtmlId(element)}));
                    footnoteHtml.text("↑");
                    footnoteHtml.closeAll();
                    html.append(footnoteHtml);
                    html.close();
                    callback();
                }
            });
        },
        "image": options.convertImage || defaultConvertImage,
        "table": convertTable,
        "tableRow": convertTableRow,
        "tableCell": convertTableCell,
        "lineBreak": function(element, html, messages, callback) {
            html.selfClosing(htmlPaths.element("br"));
            callback();
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
