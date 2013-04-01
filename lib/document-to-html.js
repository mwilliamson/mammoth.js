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
        elementToHtml(document, html);
        html.closeAll();
        
        return q.when({
            html: html.asString()
        }); 
    }
    
    function convertElements(elements, html) {
        elements.forEach(function(element) {
            elementToHtml(element, html);
        });
    }

    function elementToHtml(element, html) {
        var handler = elementConverters[element.type];
        if (handler) {
            handler(element, html);
        }
    }
    
    function convertParagraph(element, html) {
        html.style(styleForParagraph(element));
        convertElements(element.children, html);
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
        convertElements(run.children, runHtml);
        runHtml.closeAll();
        html.append(runHtml);
    }

    var elementConverters = {
        "document": function(document, html) {
            convertElements(document.children, html);
        },
        "paragraph": convertParagraph,
        "run": convertRun,
        "text": function(element, html) {
            html.text(element.value);
        }
    };
    return {
        convertToHtml: convertToHtml
    }
}
