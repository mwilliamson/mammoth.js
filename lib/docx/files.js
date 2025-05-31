var fs = require("fs");
var url = require("url");
var os = require("os");
var dirname = require("path").dirname;
var resolvePath = require("path").resolve;
var isAbsolutePath = require('path-is-absolute');

var promises = require("../promises");


exports.Files = Files;
exports.uriToPath = uriToPath;


function Files(base) {
    function read(uri, encoding) {
        return resolveUri(uri).then(function(path) {
            return readFile(path, encoding).caught(function(error) {
                var message = "could not open external image: '" + uri + "' (document directory: '" + base + "')\n" + error.message;
                return Promise.reject(new Error(message));
            });
        });
    }

    function resolveUri(uri) {
        var path = uriToPath(uri);
        if (isAbsolutePath(path)) {
            return Promise.resolve(path);
        } else if (base) {
            return Promise.resolve(resolvePath(base, path));
        } else {
            return Promise.reject(new Error("could not find external image '" + uri + "', path of input document is unknown"));
        }
    }

    return {
        read: read
    };
}


function relativeToFile(filePath) {
    return new Files(dirname(filePath));
}

Files.relativeToFile = relativeToFile;


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
