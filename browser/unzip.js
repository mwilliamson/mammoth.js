var zipfile = require("../lib/zipfile");

exports.openZip = openZip;

function openZip(options) {
    if (options.arrayBuffer) {
        return Promise.resolve(zipfile.openArrayBuffer(options.arrayBuffer));
    } else {
        return Promise.reject(new Error("Could not find file in options"));
    }
}
