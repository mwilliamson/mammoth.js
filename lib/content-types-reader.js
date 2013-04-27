exports.readContentTypesFromZipFile = readContentTypesFromZipFile;


function readContentTypesFromZipFile(file) {
    return {
        findContentType: function(path) {
            return "image/png";
        }
    }
}
