exports.openZip = openZip;

var q = require("q");
var fs = require("fs");
var unzip = {
    Parse: require("unzip/lib/parse")
};
var Buffers = require("buffers");
var streamBuffers = require("stream-buffers");

function openZip(options) {
    if (options.path) {
        return unzipStream(fs.createReadStream(options.path));
    } else if (options.file) {
        return options.file;
    } else if (options.uint8Array) {
        return unzipUint8Array(options.uint8Array);
    } else {
        return q.reject(new Error("Could not find file in options"));
    }
}

function unzipUint8Array(array) {
    var buffer = new Buffer(array);
    var stream = new streamBuffers.ReadableStreamBuffer();
    stream.put(buffer);
    return unzipStream(stream);
}

function unzipStream(stream) {
    var deferred = q.defer();
    var names = [];
    var files = {};
    
    stream
        .pipe(unzip.Parse())
        .on("entry", function(entry) {
            names.push(entry.path);
            files[entry.path] = readEntry(entry);
        })
        .on("close", function() {
            deferred.resolve(zipFile);
        })
        .on("error", function(err) {
            deferred.reject(err);
        });
    
    var exists = function(path) {
        return names.indexOf(path) !== -1;
    }
            
    function readEntry(entry) {
        var readDeferred = q.defer();
        var buffers = new Buffers();
        
        entry
            .on("data", function(data) {
                buffers.push(data);
            })
            .on("end", function() {
                readDeferred.resolve(buffers);
            })
            .on("error", readDeferred.reject.bind(readDeferred))
            
        return readDeferred.promise;
    }
    var zipFile = {
        read: function(path, encoding) {
            if (!exists(path)) {
                return q.reject(new Error("No file in zip: " + path));
            }
            return files[path].then(function(buffer) {
                if (encoding) {
                    return buffer.toString(encoding);
                } else {
                    return buffer;
                }
            });
        },
        exists: exists
    };
    return deferred.promise;
}
