var promises = require("../promises");
var unzip = require("../unzip");

exports.writeStyleMap = writeStyleMap;
exports.readStyleMap = readStyleMap;


var styleMapPath = "mammoth/style-map";

function writeStyleMap(options) {
    return promises.when(unzip.openZip(options))
        .then(function(zipFile) {
            
            zipFile.write(styleMapPath, options.styleMap);
            
            return {
                toBuffer: zipFile.toBuffer
            };
        });
}

function readStyleMap(options) {
    return promises.when(unzip.openZip(options))
        .then(function(zipFile) {
            if (zipFile.exists(styleMapPath)) {
                return zipFile.read(styleMapPath, "utf8");
            } else {
                return promises.when(null);
            }
        });
}
