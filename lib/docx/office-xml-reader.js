var _ = require("underscore");

var xml = require("../xml");

exports.read = read;
exports.readXmlFromZipFile = readXmlFromZipFile;

var xmlNamespaceMap = {
  // Transitional format
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main": "w",
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships": "r",
  "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing":
    "wp",
  "http://schemas.openxmlformats.org/drawingml/2006/main": "a",
  "http://schemas.openxmlformats.org/drawingml/2006/picture": "pic",

  // Strict format
  "http://purl.oclc.org/ooxml/wordprocessingml/main": "w",
  "http://purl.oclc.org/ooxml/officeDocument/relationships": "r",
  "http://purl.oclc.org/ooxml/drawingml/wordprocessingDrawing": "wp",
  "http://purl.oclc.org/ooxml/drawingml/main": "a",
  "http://purl.oclc.org/ooxml/drawingml/picture": "pic",

  // Common
  "http://schemas.openxmlformats.org/package/2006/content-types":
    "content-types",
  "http://schemas.openxmlformats.org/package/2006/relationships":
    "relationships",
  "http://schemas.openxmlformats.org/markup-compatibility/2006": "mc",
  "urn:schemas-microsoft-com:vml": "v",
  "urn:schemas-microsoft-com:office:word": "office-word",
};

function read(xmlString) {
  return xml.readString(xmlString, xmlNamespaceMap).then(function (document) {
    return collapseAlternateContent(document)[0];
  });
}

async function readXmlFromZipFile(docxFile, path) {
  if (docxFile.exists(path)) {
    return docxFile.read(path, "utf-8").then(stripUtf8Bom).then(read);
  } else {
    return null;
  }
}

function stripUtf8Bom(xmlString) {
  return xmlString.replace(/^\uFEFF/g, "");
}

function collapseAlternateContent(node) {
  if (node.type === "element") {
    if (node.name === "mc:AlternateContent") {
      return node.first("mc:Fallback").children;
    } else {
      node.children = _.flatten(
        node.children.map(collapseAlternateContent, true)
      );
      return [node];
    }
  } else {
    return [node];
  }
}
