var fs = require("fs");

var promises = require("../promises");


exports.Files = Files;


function Files() {
    function read(path, encoding) {
        // TODO: check whether this works for Windows file URIs
        var fileUriPrefix = "file:///";
        if (startsWith(path, fileUriPrefix)) {
            return readFile(path.slice(fileUriPrefix.length - 1), encoding);
        }
    }
    
    return {
        read: read
    };
}

var readFile = promises.promisify(fs.readFile.bind(fs));

function startsWith(string, search) {
    return string.indexOf(search) === 0;
}
