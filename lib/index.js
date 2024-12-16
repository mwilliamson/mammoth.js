var docxReader = require("./docx/docx-reader");
var unzip = require("./unzip");

exports.extractNodeList = extractNodeList;
exports.images = require("./images");
exports.transforms = require("./transforms");
exports.underline = require("./underline");

function extractNodeList(input) {
  return unzip.openZip(input).then(function (docxFile) {
    return docxReader.read(docxFile, input).then(function (documentResult) {
      return documentResult;
    });
  });
}
