exports.readFootnotesXml = readFootnotesXml;

var Footnotes = require("../documents").Footnotes;

function readFootnotesXml(xml) {
    var footnotes = {};
    
    xml.root.getElementsByTagName("w:footnote").forEach(function(footnoteElement) {
        var id = footnoteElement.attributes["w:id"];
        footnotes[id] = readFootnoteElement(footnoteElement);
    });
    
    return new Footnotes(footnotes);
}

function readFootnoteElement(footnoteElement) {
    var body = footnoteElement.children;
    return {body: body};
}
