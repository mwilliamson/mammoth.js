var fs = require("fs");
var url = require("url");

var promises = require("../promises");


exports.Files = Files;
exports.uriToPath = uriToPath;


function Files() {
    function read(uri, encoding) {
        return readFile(uriToPath(uri), encoding);
    }
    
    return {
        read: read
    };
}

var readFile = promises.promisify(fs.readFile.bind(fs));


function uriToPath(uriString) {
    var uri = url.parse(uriString);
    if (uri.protocol === "file:" && (!uri.host || uri.host === "localhost")) {
        return decodeURIComponent(uri.path);
    } else {
        throw new Error("Could not convert URI to path: " + uriString);
    }
}
