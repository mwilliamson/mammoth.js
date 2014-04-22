exports.readStylesXml = readStylesXml;

function Styles(paragraphStyles) {
    return {
        findParagraphStyleById: function(styleId) {
            return paragraphStyles[styleId];
        }
    };
}

function readStylesXml(xml) {
    var paragraphStyles = [];
    
    xml.root.getElementsByTagName("w:style").forEach(function(styleElement) {
        var style = readStyleElement(styleElement);
        paragraphStyles[style.styleId] = style;
    });
    
    return new Styles(paragraphStyles);
}

function readStyleElement(styleElement) {
    var styleId = styleElement.attributes["w:styleId"];
    return {styleId: styleId};
}
