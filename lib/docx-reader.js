exports.read = read;

var q = require("q");
var unzip = require("./unzip");
var path = require("path");
var fs = require("fs");

var officeXmlReader = require("./office-xml-reader");
var documents = require("./documents");
var DocumentXmlReader = require("./document-xml-reader").DocumentXmlReader;
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
            readXmlFile(docxFile, "word/_rels/document.xml.rels"),
            readXmlFile(docxFile, "word/document.xml")
        ]).spread(function(relationshipsXml, documentXml) {
            var relationships = relationshipsXml ? readRelationships(relationshipsXml) : {};
            var contentTypes = {
                findContentType: function(path) {
                    return "image/png";
                }
            };
            var reader = new DocumentXmlReader(relationships, contentTypes, docxFile);
            return reader.convertXmlToDocument(documentXml);
        });
    });
}

function readXmlFile(docxFile, path) {
    if (docxFile.exists(path)) {
        return docxFile.read(path, "utf-8")
            .then(officeXmlReader.read);
    } else {
        return null;
    }
}

function readRelationships(relationshipsXml) {
    var relationships = {};
    relationshipsXml.root.children.forEach(function(child) {
        if (child.name === "{http://schemas.openxmlformats.org/package/2006/relationships}:Relationship") {
            relationships[child.attributes.Id] = {
                target: child.attributes.Target
            };
        }
    });
    return relationships;
}
