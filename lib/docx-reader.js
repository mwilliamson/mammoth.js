exports.read = read;

var q = require("q");
var _ = require("underscore");
var unzip = require("unzip");
var path = require("path");
var fs = require("fs");
var Buffers = require("buffers");

var xmlreader = require("./xmlreader");
var documents = require("./documents");
var DocumentXmlReader = require("./document-xml-reader").DocumentXmlReader;
var Result = require("./results").Result;


function read(docxFile) {
    if (_.isString(docxFile)) {
        var zipPath = docxFile;
        docxFile = openZip(zipPath);
    }
    return q.when(docxFile, function(docxFile) {
    
        return q.all([
            readXmlFile(docxFile, "word/_rels/document.xml.rels"),
            readXmlFile(docxFile, "word/document.xml")
        ]).spread(function(relationshipsXml, documentXml) {
            var relationships = relationshipsXml ? readRelationships(relationshipsXml) : {};
            var reader = new DocumentXmlReader(relationships, docxFile);
            return reader.convertXmlToDocument(documentXml);
        });
    });
}

function openZip(zipPath) {
    var deferred = q.defer();
    var names = [];
    var files = {};
    
    fs.createReadStream(zipPath)
        .pipe(unzip.Parse())
        .on("entry", function(entry) {
            names.push(entry.path);
            files[entry.path] = readEntry(entry);
        })
        .on("close", function() {
            deferred.resolve(zipFile);
        })
        .on("error", function(err) {
            deferred.reject(err);
        });
    
    var exists = function(path) {
        return names.indexOf(path) !== -1;
    }
            
    function readEntry(entry) {
        var readDeferred = q.defer();
        var buffers = new Buffers();
        
        entry
            .on("data", function(data) {
                buffers.push(data);
            })
            .on("end", function() {
                readDeferred.resolve(buffers);
            })
            .on("error", readDeferred.reject.bind(readDeferred))
            
        return readDeferred.promise;
    }
    var zipFile = {
        read: function(path, encoding) {
            if (!exists(path)) {
                return q.reject(new Error("No file in zip: " + path));
            }
            return files[path].then(function(buffer) {
                if (encoding) {
                    return buffer.toString(encoding);
                } else {
                    return buffer;
                }
            });
        },
        exists: exists
    };
    return deferred.promise;
}

function readXmlFile(docxFile, path) {
    var xmlNamespaceMap = {
        "http://schemas.openxmlformats.org/wordprocessingml/2006/main": "w",
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships": "r",
        "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing": "wp",
        "http://schemas.openxmlformats.org/drawingml/2006/main": "a",
        "http://schemas.openxmlformats.org/drawingml/2006/picture": "pic"
    };
    
    if (docxFile.exists(path)) {
        return docxFile.read(path, "utf-8")
            .then(function(xmlString) {
                return xmlreader.read(xmlString, xmlNamespaceMap);
            });
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

function parseXml(string) {
    return xmlreader.read(string);
}
