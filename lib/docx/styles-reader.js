exports.readStylesXml = readStylesXml;
exports.Styles = Styles;
exports.defaultStyles = new Styles({}, {});

function Styles(paragraphStyles, characterStyles) {
    return {
        findParagraphStyleById: function(styleId) {
            return paragraphStyles[styleId];
        },
        findCharacterStyleById: function(styleId) {
            return characterStyles[styleId];
        }
    };
}

function readStylesXml(xml) {
    var paragraphStyles = {};
    var characterStyles = {};
    
    xml.root.getElementsByTagName("w:style").forEach(function(styleElement) {
        var style = readStyleElement(styleElement);
        var styleSet = style.type === "paragraph" ? paragraphStyles : characterStyles;
        styleSet[style.styleId] = style;
    });
    
    return new Styles(paragraphStyles, characterStyles);
}

function readStyleElement(styleElement) {
    var type = styleElement.attributes["w:type"];
    var styleId = styleElement.attributes["w:styleId"];
    var name = styleElement.first("w:name").attributes["w:val"];
    return {type: type, styleId: styleId, name: name};
}
