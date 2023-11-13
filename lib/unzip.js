var fs = require("fs");

var promises = require("./promises");
var zipfile = require("./zipfile");

exports.openZip = openZip;

var readFile = promises.promisify(fs.readFile);

function openZip(options) {
    if (options.path) {
        return readFile(options.path).then(zipfile.openArrayBuffer);
    } else if (options.buffer) {
        return Promise.resolve(zipfile.openArrayBuffer(options.buffer));
    } else if (options.file) {
        return Promise.resolve(options.file);
    } else {
        return Promise.reject(new Error("Could not find file in options"));
    }
}
