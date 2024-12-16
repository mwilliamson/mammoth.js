var docxReader = require("./docx/docx-reader");
const zipfile = require("./zipfile");

exports.extractNodeList = extractNodeList;
exports.transforms = require("./transforms");

function extractNodeList(buffer) {
  return zipfile.openArrayBuffer(buffer).then(function (docxFile) {
    return docxReader.read(docxFile).then(function (documentResult) {
      return documentResult;
    });
  });
}
