var fs = require("fs");
var url = require("url");
var os = require("os");
var resolvePath = require("path").resolve;

var promises = require("../promises");


exports.Files = Files;
exports.uriToPath = uriToPath;


function Files(base) {
    function read(uri, encoding) {
        return readFile(resolvePath(base, uriToPath(uri)), encoding);
    }
    
    return {
        read: read
    };
}

var readFile = promises.promisify(fs.readFile.bind(fs));


function uriToPath(uriString, platform) {
    if (!platform) {
        platform = os.platform();
    }
    
    var uri = url.parse(uriString);
    if (isLocalFileUri(uri) || isRelativeUri(uri)) {
        var path = decodeURIComponent(uri.path);
        if (platform === "win32" && /^\/[a-z]:/i.test(path)) {
            return path.slice(1);
        } else {
            return path;
        }
    } else {
        throw new Error("Could not convert URI to path: " + uriString);
    }
}

function isLocalFileUri(uri) {
    return uri.protocol === "file:" && (!uri.host || uri.host === "localhost");
}

function isRelativeUri(uri) {
    return !uri.protocol && !uri.host;
}
