var util = require("util");

var q = require("q");

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
        var html = document.children.map(elementToHtml).join("");
        
        return q.when({
            html: html
        }); 
    }

    function elementToHtml(element) {
        var handler = elementConverters[element.type];
        if (handler) {
            return handler(element);
        } else {
            return "";
        }
    }
    
    function convertParagraph(element) {
        var innerHtml = element.children.map(elementToHtml).join("");
        var tagName = styleForParagraph(element);
        return util.format("<%s>%s</%s>", tagName, innerHtml, tagName);
    }
    
    function styleForParagraph(element) {
        return paragraphStyleMap[element.properties.styleName] || "p";
    }

    var elementConverters = {
        "paragraph": convertParagraph,
        "run": function(element) {
            return element.children.map(elementToHtml).join("");
        },
        "text": function(element) {
            return escapeHtml(element.value);
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
