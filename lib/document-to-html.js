var q = require("q");

var styles = require("./styles");
var HtmlGenerator = require("./html-generator").HtmlGenerator;

exports.DocumentConverter = DocumentConverter;


function DocumentConverter(options) {
    options = options || {};
    var defaultParagraphStyle = options.defaultParagraphStyle || styles.topLevelElement("p");
    
    var paragraphStyleMap = options.paragraphStyleMap || {};
    var runStyleMap = options.runStyleMap || {};
    
    function convertToHtml(document) {
        var html = new HtmlGenerator();
        return elementToHtml(document, html)
            .then(function() {
                html.closeAll();
                
                return {
                    html: html.asString()
                }; 
            });
    }
    
    function convertElements(elements, html) {
        return forEachPromise(elements, function(element) {
            return elementToHtml(element, html);
        });
    }

    function elementToHtml(element, html) {
        var handler = elementConverters[element.type];
        if (handler) {
            return q.when(handler(element, html));
        } else {
            return q.when();
        }
    }
    
    function convertParagraph(element, html) {
        html.style(styleForParagraph(element));
        return convertElements(element.children, html);
    }
    
    function styleForParagraph(element) {
        return paragraphStyleMap[element.properties.styleName] || defaultParagraphStyle;
    }
    
    function convertRun(run, html) {
        var runHtml = new HtmlGenerator();
        if (run.properties.styleName) {
            var style = runStyleMap[run.properties.styleName];
            if (style) {
                runHtml.style(style);
            }
        }
        if (run.properties.isBold) {
            runHtml.push(styles.element("strong"));
        }
        if (run.properties.isItalic) {
            runHtml.push(styles.element("em"));
        }
        return convertElements(run.children, runHtml)
            .then(function() {
                runHtml.closeAll();
                html.append(runHtml);
            });
    }

    var elementConverters = {
        "document": function(document, html) {
            return convertElements(document.children, html);
        },
        "paragraph": convertParagraph,
        "run": convertRun,
        "text": function(element, html) {
            html.text(element.value);
        },
        "hyperlink": function(element, html) {
            html.push(styles.element("a", {href: element.href}));
            return convertElements(element.children, html).then(function() {
                html.pop();
            });
        },
        "image": function(element, html) {
            return element.read().then(function(imageBuffer) {
                // TODO: set alt attribute to wp:inline/wp:docPr/@descr
                var src = "data:image/png;base64," + imageBuffer.toString("base64");
                html.selfClosing(styles.element("img", {"src": src}))
            });
        }
    };
    return {
        convertToHtml: convertToHtml
    }
}

function forEachPromise(array, func) {
    var index = -1;
    return next();
    
    function next() {
        index++;
        if (index < array.length) {
            return q.when(func(array[index]))
                .then(next);
        } else {
            return q.when();
        }
    }
}
