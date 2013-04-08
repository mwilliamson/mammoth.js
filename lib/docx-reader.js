exports.read = read;

var q = require("q");
var _ = require("underscore");
var ZipFile = require("zipfile").ZipFile;
var path = require("path");

var xmlreader = require("./xmlreader");
var documents = require("./documents");
var DocumentXmlReader = require("./document-xml-reader").DocumentXmlReader;
var Result = require("./results").Result;


function read(docxFile) {
    if (_.isString(docxFile)) {
        var zipFile = new ZipFile(docxFile);
        var exists = function(path) {
            return zipFile.names.indexOf(path) !== -1;
        }
        docxFile = {
            read: function(path, encoding) {
                if (exists(path)) {
                    return q.ninvoke(zipFile, "readFile", path)
                        .then(function(value) {
                            if (encoding) {
                                return value.toString(encoding);
                            } else {
                                return value;
                            }
                        });
                } else {
                    return q.reject(new Error("No file in zip: " + path));
                }
            },
            exists: exists
        };
    }
    
    return q.all([
        readXmlFile(docxFile, "word/_rels/document.xml.rels"),
        readXmlFile(docxFile, "word/document.xml")
    ]).spread(function(relationshipsXml, documentXml) {
        var relationships = relationshipsXml ? readRelationships(relationshipsXml) : {};
        var reader = new DocumentXmlReader(relationships, docxFile);
        return reader.convertXmlToDocument(documentXml);
    });
}

function readXmlFile(docxFile, path) {
    if (docxFile.exists(path)) {
        return docxFile.read(path, "utf-8")
            .then(xmlreader.read);
    } else {
        return null;
    }
}

function readRelationships(relationshipsXml) {
    var relationships = {};
    relationshipsXml.root.children.forEach(function(child) {
        if (child.name === "Relationship") {
            relationships[child.attributes.Id] = {
                target: child.attributes.Target
            };
        }
    });
    return relationships;
}

function parseXml(string) {
    return xmlreader.read(string);
}
