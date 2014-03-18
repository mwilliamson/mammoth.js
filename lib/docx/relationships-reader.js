var readXmlFromZipFile = require("./office-xml-reader").readXmlFromZipFile;


exports.readRelationshipsFromZipFile = readRelationshipsFromZipFile;


function readRelationshipsFromZipFile(file) {
    return readXmlFromZipFile(file, "word/_rels/document.xml.rels")
        .then(function(relationshipsXml) {
            return relationshipsXml ? readRelationships(relationshipsXml) : {};
        });
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
