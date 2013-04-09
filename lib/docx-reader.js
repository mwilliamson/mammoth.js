exports.read = read;

var q = require("q");
var _ = require("underscore");
var unzip = require("unzip");
var path = require("path");
var fs = require("fs");

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
    
    fs.createReadStream(zipPath)
        .pipe(unzip.Parse())
        .on("entry", function(entry) {
            names.push(entry.path);
            entry.autodrain();
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
    var zipFile = {
        read: function(path, encoding) {
            if (!exists(path)) {
                return q.reject(new Error("No file in zip: " + path));
            }
            var readDeferred = q.defer();
            
            var readStream = fs.createReadStream(zipPath)
                .pipe(unzip.Parse())
                .on("entry", function(entry) {
                    if (entry.path === path) {
                        readEntry(entry);
                    } else {
                        entry.autodrain();
                    }
                })
                .on("error", readDeferred.reject.bind(readDeferred));
            
            function readEntry(entry) {
                entry.setEncoding(encoding);
                
                var fragments = [];
                
                entry
                    .on("data", function(data) {
                        fragments.push(data);
                    })
                    .on("end", function() {
                        readDeferred.resolve(fragments.join(""));
                    })
                    .on("error", readDeferred.reject.bind(readDeferred))
            }
            
            return readDeferred.promise;
        },
        exists: exists
    };
    return deferred.promise;
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
