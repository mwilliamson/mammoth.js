exports.read = read;

var promises = require("../promises");
var unzip = require("../unzip");

var readXmlFromZipFile = require("./office-xml-reader").readXmlFromZipFile;
var documents = require("../documents");
var DocumentXmlReader = require("./document-xml-reader").DocumentXmlReader;
var readRelationshipsFromZipFile = require("./relationships-reader").readRelationshipsFromZipFile;
var readContentTypesFromZipFile = require("./content-types-reader").readContentTypesFromZipFile;
var readNumberingFromZipFile = require("./numbering-xml").readNumberingFromZipFile;


function read(options) {
    var docxFile = unzip.openZip(options);
    return promises.when(docxFile).then(function(docxFile) {
        return promises.all([
            readRelationshipsFromZipFile(docxFile),
            readContentTypesFromZipFile(docxFile),
            readNumberingFromZipFile(docxFile),
            readXmlFromZipFile(docxFile, "word/document.xml")
        ]).spread(function(relationships, contentTypes, numbering, documentXml) {
            var reader = new DocumentXmlReader(relationships, contentTypes, docxFile, numbering);
            return reader.convertXmlToDocument(documentXml);
        });
    });
}
