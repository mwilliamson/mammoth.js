exports.openZip = openZip;

var fs = require("fs");
var util = require("util");

var zipfile = require("./zipfile");

exports.openZip = openZip;

var readFile = util.promisify(fs.readFile);

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
