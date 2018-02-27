exports.readStylesXml = readStylesXml;
exports.readNumberingStylesXml = readNumberingStylesXml;
exports.Styles = Styles;
exports.defaultStyles = new Styles({}, {});
exports.defaultNumberingStyles = {};

function Styles(paragraphStyles, characterStyles, tableStyles) {
    return {
        findParagraphStyleById: function(styleId) {
            return paragraphStyles[styleId];
        },
        findCharacterStyleById: function(styleId) {
            return characterStyles[styleId];
        },
        findTableStyleById: function(styleId) {
            return tableStyles[styleId];
        }
    };
}

Styles.EMPTY = new Styles({}, {}, {});

function readStylesXml(root) {
    var paragraphStyles = {};
    var characterStyles = {};
    var tableStyles = {};
    
    var styles = {
        "paragraph": paragraphStyles,
        "character": characterStyles,
        "table": tableStyles
    };
    
    root.getElementsByTagName("w:style").forEach(function(styleElement) {
        var style = readStyleElement(styleElement);
        var styleSet = styles[style.type];
        if (styleSet) {
            styleSet[style.styleId] = style;
        }
    });
    
    return new Styles(paragraphStyles, characterStyles, tableStyles);
}

function readStyleElement(styleElement) {
    var type = styleElement.attributes["w:type"];
    var styleId = styleElement.attributes["w:styleId"];
    var name = styleName(styleElement);
    var marginLeft = styleElement.firstOrEmpty("w:pPr").firstOrEmpty("w:ind").attributes["w:left"];
    return {type: type, styleId: styleId, name: name, marginLeft: (marginLeft || null)};
}

function styleName(styleElement) {
    var nameElement = styleElement.first("w:name");
    return nameElement ? nameElement.attributes["w:val"] : null;
}

function readNumberingStylesXml(root) {
    var numberingStyles = {};

    root.getElementsByTagName("w:style").forEach(function(styleElement) {
        var type = styleElement.attributes["w:type"];
        if (type !== "numbering") {
            return;
        }
        var styleId = styleElement.attributes["w:styleId"];
        var numId = styleElement.firstOrEmpty("w:pPr").firstOrEmpty("w:numPr").firstOrEmpty("w:numId").attributes["w:val"];
        numberingStyles[styleId] = {styleId: styleId, numId: numId};
    });

    return numberingStyles;
}
