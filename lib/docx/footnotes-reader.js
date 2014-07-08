exports.readFootnotesXml = readFootnotesXml;

function readFootnotesXml(xml) {
    return xml.root.getElementsByTagName("w:footnote")
        .filter(isFootnoteElement)
        .map(readFootnoteElement);
}

function isFootnoteElement(element) {
    var type = element.attributes["w:type"];
    return type !== "continuationSeparator" && type !== "separator";
}

function readFootnoteElement(footnoteElement) {
    var id = footnoteElement.attributes["w:id"];
    var body = footnoteElement.children;
    return {id: id, body: body};
}
