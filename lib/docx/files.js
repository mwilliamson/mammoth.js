var fs = require("fs");

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


function uriToPath(uri) {
    var fileUriPrefix = "file:///";
    if (startsWith(uri, fileUriPrefix)) {
        return uri.slice(fileUriPrefix.length - 1);
    } else {
        throw new Error("Could not convert URI to path: " + uri);
    }
}

function startsWith(string, search) {
    return string.indexOf(search) === 0;
}
