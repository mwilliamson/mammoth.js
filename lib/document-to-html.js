var q = require("q");
var async = require("async");

var htmlPaths = require("./html-paths");
var HtmlGenerator = require("./html-generator").HtmlGenerator;
var results = require("./results");

exports.DocumentConverter = DocumentConverter;


function DocumentConverter(options) {
    options = options || {};
    var defaultParagraphStyle = options.defaultParagraphStyle || htmlPaths.topLevelElement("p");
    
    var styleMap = options.styleMap || [];
    
    function convertToHtml(document) {
        var messages = [];
        var html = new HtmlGenerator();
        
        return q.nfcall(elementToHtml, document, html, messages).then(function() {
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
        process.nextTick(function() {
            convertElements(element.children, html, messages, callback);
        });
    }
    
    function styleForParagraph(element, messages) {
        var style = findStyle(element);
        
        if (style) {
            return style.to;
        } else {
            if (element.styleName) {
                messages.push(results.warning("Unrecognised paragraph style: " + element.styleName));
            }
            return defaultParagraphStyle;
        }
    }
    
    function convertRun(run, html, messages, callback) {
        var runHtml = new HtmlGenerator();
        if (run.styleName) {
            var style = findStyle(run);
            if (style) {
                runHtml.satisfyPath(style.to);
            } else {
                messages.push(results.warning("Unrecognised run style: " + run.styleName));
            }
        }
        if (run.isBold) {
            runHtml.open(htmlPaths.element("strong"));
        }
        if (run.isItalic) {
            runHtml.open(htmlPaths.element("em"));
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
    
    function defaultConvertImage(element, html, messages, callback) {
        element.read("base64").then(function(imageBuffer) {
            var src = "data:" + element.contentType + ";base64," + imageBuffer;
            var attributes = {src: src};
            if (element.altText) {
                attributes.alt = element.altText;
            }
            html.selfClosing(htmlPaths.element("img", attributes));
            callback();
        }).fail(callback);
    }

    var elementConverters = {
        "document": function(document, html, messages, callback) {
            convertElements(document.children, html, messages, callback);
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
        "image": options.convertImage || defaultConvertImage
    };
    return {
        convertToHtml: convertToHtml
    }
}
