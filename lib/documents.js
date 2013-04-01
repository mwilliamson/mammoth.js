var q = require("q");

var styles = require("./styles");
var HtmlGenerator = require("./html-generator").HtmlGenerator;

exports.DocumentConverter = DocumentConverter;
exports.Document = Document;
exports.Paragraph = Paragraph;
exports.Run = Run;
exports.Text = Text;

function DocumentConverter(options) {
    options = options || {};
    options.paragraphStyleMap = options.paragraphStyleMap || {};
    var defaultParagraphStyle = options.defaultParagraphStyle || styles.topLevelElement("p");
    
    var paragraphStyleMap = options.paragraphStyleMap;
    
    function convertToHtml(document) {
        var html = new HtmlGenerator();
        convertElements(document.children, html);
        
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

    var elementConverters = {
        "paragraph": convertParagraph,
        "run": function(element, html) {
            convertElements(element.children, html);
        },
        "text": function(element, html) {
            html.text(element.value);
        }
    };
    return {
        convertToHtml: convertToHtml
    }
}

function Document(children) {
    return {
        type: "document",
        children: children
    };
}

function Paragraph(children, properties) {
    return {
        type: "paragraph",
        children: children,
        properties: properties || {}
    };
}

function Run(children, properties) {
    return {
        type: "run",
        children: children,
        properties: properties || {}
    };
}

function Text(value) {
    return {
        type: "text",
        value: value
    };
}
