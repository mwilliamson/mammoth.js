var util = require("util");

var q = require("q");

var styles = require("./styles");

exports.DocumentConverter = DocumentConverter;
exports.Document = Document;
exports.Paragraph = Paragraph;
exports.Run = Run;
exports.Text = Text;

function DocumentConverter(options) {
    options = options || {};
    options.paragraphStyleMap = options.paragraphStyleMap || {};
    
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
            return handler(element, html);
        } else {
            return "";
        }
    }
    
    function convertParagraph(element, html) {
        html.style(styleForParagraph(element));
        convertElements(element.children, html);
    }
    
    function styleForParagraph(element) {
        return paragraphStyleMap[element.properties.styleName] || styles.topLevelElement("p");
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

function HtmlGenerator() {
    var stack = [];
    var fragments = [];
    
    function text(value) {
        fragments.push(escapeHtml(value))
    }
    
    function asString() {
        popAll();
        return fragments.join("");
    }
    
    function style(style) {
        popAll();
        style.forEach(function(tagName) {
            push(tagName);
        });
    }
    
    function push(element) {
        stack.push(element);
        fragments.push(util.format("<%s>", element));
    }
    
    function pop() {
        var element = stack.pop();
        fragments.push(util.format("</%s>", element));
    }
    
    function popAll() {
        while (stack.length > 0) {
            pop();
        }
    }
    
    return {
        style: style,
        text: text,
        asString: asString
    };
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

function Run(children) {
    return {
        type: "run",
        children: children
    };
}

function Text(value) {
    return {
        type: "text",
        value: value
    };
}

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
