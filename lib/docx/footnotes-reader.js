exports.readFootnotesXml = readFootnotesXml;

var Footnotes = require("../documents").Footnotes;

function readFootnotesXml(xml) {
    return xml.root.getElementsByTagName("w:footnote").map(readFootnoteElement);
}

function readFootnoteElement(footnoteElement) {
    var id = footnoteElement.attributes["w:id"];
    var body = footnoteElement.children;
    return {id: id, body: body};
}
