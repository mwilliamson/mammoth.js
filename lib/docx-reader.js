exports.read = read;

var q = require("q");
var unzip = require("./unzip");
var path = require("path");
var fs = require("fs");

var readXmlFromZipFile = require("./office-xml-reader").readXmlFromZipFile;
var documents = require("./documents");
var DocumentXmlReader = require("./document-xml-reader").DocumentXmlReader;
var readRelationshipsFromZipFile = require("./relationships-reader").readRelationshipsFromZipFile;
var readContentTypesFromZipFile = require("./content-types-reader").readContentTypesFromZipFile;
var readNumberingFromZipFile = require("./numbering-xml").readNumberingFromZipFile;
var Result = require("./results").Result;


function read(options) {
    var docxFile;
    if (options.path) {
        docxFile = unzip.unzipStream(fs.createReadStream(options.path));
    } else if (options.file) {
        docxFile = options.file;
    } else if (options.uint8Array) {
        docxFile = unzip.unzipUint8Array(options.uint8Array);
    } else {
        return q.reject(new Error("Could not find file in options"));
    }
    return q.when(docxFile, function(docxFile) {
        return q.all([
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
