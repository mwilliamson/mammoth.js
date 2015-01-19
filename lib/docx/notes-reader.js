exports.readFootnotesXml = createReader("footnote");
exports.readEndnotesXml = createReader("endnote");

function createReader(noteType) {
    function readNotesXml(xml) {
        return xml.root.getElementsByTagName("w:" + noteType)
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
        return {noteType: noteType, id: id, body: body};
    }
    
    return readNotesXml;
}
