var q = require("q");
var mammoth = require("./");


module.exports = Object.create(mammoth);

module.exports.fileInput = fileInput;
module.exports.readFileInputOnChange = readFileInputOnChange;

function readFileInputOnChange(inputElement, callback) {
    function handleFileSelect(event) {
        var file = event.target.files[0];

        var reader = new FileReader();
        
        reader.onload = function(loadEvent) {
            var arrayBuffer = loadEvent.target.result;
            try {
                mammoth.read({file: openFile(arrayBuffer)})
                    .then(callback, function(error) {
                        callback({error: error});
                    })
                    .done();
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
            mammoth.convertDocumentToHtml(documentResult, options)
                .then(callback, function(error) {
                    callback({error: error});
                })
                .done();
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
