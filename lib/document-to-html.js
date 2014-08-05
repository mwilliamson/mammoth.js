var promises = require("./promises");
var async = require("async");

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
    var footnoteNumber = 1;
    
    var footnoteIds = [];
    
    options = options || {};
    var generateUniquifier = options.generateUniquifier || function() {
        return Math.floor(Math.random() * 1000000000000000);
    };
    var uniquifier = generateUniquifier();
    
    var defaultParagraphStyle = htmlPaths.topLevelElement("p");
    
    var styleMap = options.styleMap || [];
    
    function convertToHtml(document) {
        var messages = [];
        var html = new HtmlGenerator({prettyPrint: options.prettyPrint});
        
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
        var runHtml = new HtmlGenerator();
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

    function footnoteUid(id) {
        return uniquifier + "-" + id;
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
            var cellHtml = new HtmlGenerator();
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
                    var footnotes = footnoteIds.map(function(id) {
                        return document.footnotes.findFootnoteById(id);
                    });
                    convertElements(footnotes, html, messages, function(error) {
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
            html.open(htmlPaths.element("a", {href: element.href}));
            convertElements(element.children, html, messages, function(err) {
                if (err) {
                    callback(err);
                } else {
                    html.close();
                    callback();
                }
            });
        },
        "footnoteReference": function(element, html, messages, callback) {
            var uid = footnoteUid(element.footnoteId);
            
            html.open(htmlPaths.element("sup"));
            html.open(htmlPaths.element("a", {
                href: "#footnote-" + uid,
                id: "footnote-ref-" + uid
            }));
            footnoteIds.push(element.footnoteId);
            html.text("[" + (footnoteNumber++) + "]");
            html.close();
            html.close();
            callback();
        },
        "footnote": function(element, html, messages, callback) {
            var uid = footnoteUid(element.id);
            
            html.open(htmlPaths.element("li", {id: "footnote-" + uid}));
            var footnoteHtml = new HtmlGenerator();
            convertElements(element.body, footnoteHtml, messages, function(err) {
                if (err) {
                    callback(err);
                } else {
                    footnoteHtml.text(" ");
                    footnoteHtml.open(htmlPaths.element("a", {href: "#footnote-ref-" + uid}));
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
