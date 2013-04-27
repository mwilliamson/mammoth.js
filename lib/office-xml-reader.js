var xmlreader = require("./xmlreader");


exports.read = read;

var xmlNamespaceMap = {
    "http://schemas.openxmlformats.org/wordprocessingml/2006/main": "w",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships": "r",
    "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing": "wp",
    "http://schemas.openxmlformats.org/drawingml/2006/main": "a",
    "http://schemas.openxmlformats.org/drawingml/2006/picture": "pic"
};


function read(xmlString) {
    return xmlreader.read(xmlString, xmlNamespaceMap);
}
