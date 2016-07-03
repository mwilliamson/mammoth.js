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

function readStylesXml(root) {
    var paragraphStyles = {};
    var characterStyles = {};
    
    var styles = {
        "paragraph": paragraphStyles,
        "character": characterStyles
    };
    
    root.getElementsByTagName("w:style").forEach(function(styleElement) {
        var style = readStyleElement(styleElement);
        var styleSet = styles[style.type];
        if (styleSet) {
            styleSet[style.styleId] = style;
        }
    });
    
    return new Styles(paragraphStyles, characterStyles);
}

function readStyleElement(styleElement) {
    var type = styleElement.attributes["w:type"];
    var styleId = styleElement.attributes["w:styleId"];
    var name = styleName(styleElement);
    return {type: type, styleId: styleId, name: name};
}

function styleName(styleElement) {
    var nameElement = styleElement.first("w:name");
    return nameElement ? nameElement.attributes["w:val"] : null;
}
