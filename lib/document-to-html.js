var q = require("q");
var async = require("async");

var htmlPaths = require("./html-paths");
var HtmlGenerator = require("./html-generator").HtmlGenerator;
var results = require("./results");

exports.DocumentConverter = DocumentConverter;


function DocumentConverter(options) {
    options = options || {};
    var defaultParagraphStyle = options.defaultParagraphStyle || htmlPaths.topLevelElement("p");
    
    var paragraphStyleMap = options.paragraphStyleMap || {};
    var runStyleMap = options.runStyleMap || {};
    
    function convertToHtml(document) {
        var html = new HtmlGenerator();
        
        return q.nfcall(elementToHtml, document, html).then(function() {
            html.closeAll();
            
            return new results.Result(html.asString(), []);
        });
    }
    
    function convertElements(elements, html, callback) {
        async.eachSeries(elements, function(element, callback) {
            return elementToHtml(element, html, callback);
        }, callback);
    }

    function elementToHtml(element, html, callback) {
        var handler = elementConverters[element.type];
        if (handler) {
            handler(element, html, callback);
        } else {
            callback();
        }
    }
    
    function convertParagraph(element, html, callback) {
        html.satisfyPath(styleForParagraph(element));
        convertElements(element.children, html, callback);
    }
    
    function styleForParagraph(element) {
        return paragraphStyleMap[element.styleName] || defaultParagraphStyle;
    }
    
    function convertRun(run, html, callback) {
        var runHtml = new HtmlGenerator();
        if (run.styleName) {
            var style = runStyleMap[run.styleName];
            if (style) {
                runHtml.satisfyPath(style);
            }
        }
        if (run.isBold) {
            runHtml.open(htmlPaths.element("strong"));
        }
        if (run.isItalic) {
            runHtml.open(htmlPaths.element("em"));
        }
        convertElements(run.children, runHtml, function(err) {
            if (err) {
                callback(err);
            } else {
                runHtml.closeAll();
                html.append(runHtml);
                callback();
            }
        });
    }

    var elementConverters = {
        "document": function(document, html, callback) {
            convertElements(document.children, html, callback);
        },
        "paragraph": convertParagraph,
        "run": convertRun,
        "text": function(element, html, callback) {
            html.text(element.value);
            callback();
        },
        "hyperlink": function(element, html, callback) {
            html.open(htmlPaths.element("a", {href: element.href}));
            convertElements(element.children, html, function(err) {
                if (err) {
                    callback(err);
                } else {
                    html.close();
                    callback();
                }
            });
        },
        "image": function(element, html, callback) {
            element.read("base64").then(function(imageBuffer) {
                // TODO: set alt attribute to wp:inline/wp:docPr/@descr
                var src = "data:image/png;base64," + imageBuffer;
                var attributes = {src: src};
                if (element.altText) {
                    attributes.alt = element.altText;
                }
                html.selfClosing(htmlPaths.element("img", attributes));
                callback();
            }).fail(callback);
        }
    };
    return {
        convertToHtml: convertToHtml
    }
}
