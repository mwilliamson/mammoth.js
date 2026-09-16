var fs = require("fs");

var promises = require("./promises");

function readFile(path, options) {
    return promises.when(fs.promises.readFile(path, options));
}

function writeFile(path, data, options) {
    return promises.when(fs.promises.writeFile(path, data, options));
}

exports.createWriteStream = fs.createWriteStream.bind(fs);
exports.readFile = readFile;
exports.readFileSync = fs.readFileSync.bind(fs);
exports.writeFile = writeFile;
