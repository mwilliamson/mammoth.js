var readXmlFromZipFile = require("./office-xml-reader").readXmlFromZipFile;

exports.readContentTypesFromZipFile = readContentTypesFromZipFile;
exports.readContentTypesFromXml = readContentTypesFromXml;


function readContentTypesFromZipFile(file) {
    return readXmlFromZipFile(file, "[Content_Types].xml")
        .then(function(xml) {
            return xml ? readContentTypesFromXml(xml) : defaultContentTypes;
        });
}

function readContentTypesFromXml(xml) {
    var extensionDefaults = {};
    var overrides = {};
    
    xml.root.children.forEach(function(child) {
        if (child.name === "content-types:Default") {
            extensionDefaults[child.attributes.Extension] = child.attributes.ContentType;
        }
        if (child.name === "content-types:Override") {
            var name = child.attributes.PartName;
            if (name.charAt(0) === "/") {
                name = name.substring(1);
            }
            overrides[name] = child.attributes.ContentType;
        }
    });
    
    return {
        findContentType: function(path) {
            var overrideContentType = overrides[path];
            if (overrideContentType) {
                return overrideContentType;
            } else {
                var pathParts = path.split(".");
                var extension = pathParts[pathParts.length - 1];
                return extensionDefaults[extension];
            }
        }
    }
}


var defaultContentTypes = {
    findContentType: function(path) {
        return null;
    }
};
