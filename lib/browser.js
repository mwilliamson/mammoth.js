var q = require("q");
var mammoth = require("./");


exports.fileInput = fileInput;
exports.readFileInputOnChange = readFileInputOnChange;
exports.standardOptions = mammoth.standardOptions;
exports.htmlPaths = mammoth.htmlPaths;
exports.style = mammoth.style;

exports.convertDocumentToHtml = callbackify(mammoth.convertDocumentToHtml);
exports.convertArrayBufferToHtml = convertArrayBufferToHtml;

function callbackify(func) {
    return function() {
        var args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
        var callback = arguments[arguments.length - 1];
        satisfyCallback(func.apply(this, args), callback);
    };
}

function convertArrayBufferToHtml(arrayBuffer, options, callback) {
    try {
        var file = openFile(arrayBuffer);
        var result = mammoth.read({file: file}).then(function(documentResult) {
            options = options || mammoth.standardOptions;
            return mammoth.convertDocumentToHtml(documentResult, options);
        });
        satisfyCallback(result, callback);
    } catch (error) {
        callback({error: error});
    }
}

function readFileInputOnChange(inputElement, callback) {
    function handleFileSelect(event) {
        var file = event.target.files[0];

        var reader = new FileReader();
        
        reader.onload = function(loadEvent) {
            var arrayBuffer = loadEvent.target.result;
            try {
                var file = openFile(arrayBuffer);
                satisfyCallback(mammoth.read({file: file}), callback);
            } catch (error) {
                callback({error: error});
            }
        };
        
        reader.readAsArrayBuffer(file);
    }
    inputElement.addEventListener('change', handleFileSelect, false);
}

function fileInput(inputElement, callback) {
    readFileInputOnChange(inputElement, function(documentResult) {
        if (documentResult.error) {
            callback(documentResult);
        } else {
            var options = mammoth.standardOptions;
            satisfyCallback(
                mammoth.convertDocumentToHtml(documentResult, options),
                callback
            );
        }
            
    });
}

        
function openFile(arrayBuffer) {
    var zipFile = new JSZip(arrayBuffer);
    function exists(name) {
        return zipFile.file(name) !== null;
    }
    
    function read(name, encoding) {
        var array = zipFile.file(name).asUint8Array();
        var buffer = new Buffer(array);
        if (encoding) {
            return q.when(buffer.toString(encoding));
        } else {
            return q.when(buffer);
        }
    }
    return {
        exists: exists,
        read: read
    };
}


function satisfyCallback(promise, callback) {
    promise.then(callback, function(error) {
        callback({error: error});
    }).done();
}
