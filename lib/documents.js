exports.DocumentConverter = DocumentConverter;

function DocumentConverter() {
}

DocumentConverter.prototype.convertToHtml = function(documentXml) {
    var body = documentXml.root.first("w:body");
    
    var html = body.children.map(elementToHtml).join("");
    
    return {
        html: html
    }; 
}

function elementToHtml(element) {
    if (element.type === "element") {
        var handler = elementConverters[element.name];
        if (handler) {
            return handler(element);
        } else {
            return "";
        }
    }
}

var elementConverters = {
    "w:p": function(element) {
        var innerHtml = element.children.map(elementToHtml).join("");
        return "<p>" + innerHtml + "</p>";
    },
    "w:r": function(element) {
        return element.children.map(elementToHtml).join("");
    },
    "w:t": function(element) {
        return element.children[0].value;
    }
};
