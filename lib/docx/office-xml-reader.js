var promises = require("../promises");
var xmlreader = require("../xmlreader");


exports.readXmlFromZipFile = readXmlFromZipFile;

var xmlNamespaceMap = {
    "http://schemas.openxmlformats.org/wordprocessingml/2006/main": "w",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships": "r",
    "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing": "wp",
    "http://schemas.openxmlformats.org/drawingml/2006/main": "a",
    "http://schemas.openxmlformats.org/drawingml/2006/picture": "pic",
    "http://schemas.openxmlformats.org/package/2006/content-types": "content-types",
    "urn:schemas-microsoft-com:vml": "v",
    "http://schemas.openxmlformats.org/markup-compatibility/2006": "mc"
};


function read(xmlString) {
    return xmlreader.read(xmlString, xmlNamespaceMap);
}


function readXmlFromZipFile(docxFile, path) {
    if (docxFile.exists(path)) {
        return docxFile.read(path, "utf-8")
            .then(stripUtf8Bom)
            .then(read);
    } else {
        return promises.resolve(null);
    }
}


function stripUtf8Bom(xmlString) {
    return xmlString.replace(/^\uFEFF/g, '');
}
