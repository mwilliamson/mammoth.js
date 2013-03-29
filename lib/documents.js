var q = require("q");

exports.DocumentConverter = DocumentConverter;
exports.Document = Document;
exports.Paragraph = Paragraph;
exports.Run = Run;
exports.Text = Text;

function DocumentConverter() {
}

DocumentConverter.prototype.convertToHtml = function(document) {
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

var elementConverters = {
    "paragraph": function(element) {
        var innerHtml = element.children.map(elementToHtml).join("");
        return "<p>" + innerHtml + "</p>";
    },
    "run": function(element) {
        return element.children.map(elementToHtml).join("");
    },
    "text": function(element) {
        return element.value;
    }
};

function Document(children) {
    return {
        type: "document",
        children: children
    };
}

function Paragraph(children) {
    return {
        type: "paragraph",
        children: children
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
