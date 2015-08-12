var promises = require("../promises");

exports.writeStyleMap = writeStyleMap;
exports.readStyleMap = readStyleMap;


var styleMapPath = "mammoth/style-map";

function writeStyleMap(docxFile, styleMap) {
    docxFile.write(styleMapPath, styleMap);
}

function readStyleMap(docxFile) {
    if (docxFile.exists(styleMapPath)) {
        return docxFile.read(styleMapPath, "utf8");
    } else {
        return promises.resolve(null);
    }
}
