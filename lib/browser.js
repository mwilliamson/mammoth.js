var q = require("q");
var mammoth = require("./");


exports.Converter = mammoth.Converter;
exports.fileInput = fileInput;

function fileInput(inputElement, callback) {
    var converter = new mammoth.Converter(mammoth.standardOptions);
    function handleFileSelect(event) {
        var file = event.target.files[0];

        var reader = new FileReader();
        
        reader.onload = function(loadEvent) {
            var arrayBuffer = loadEvent.target.result;
            converter.convertToHtml({file: openFile(arrayBuffer)})
                .then(callback, function(error) {
                    callback({error: error});
                })
                .done();
        };
        
        reader.readAsArrayBuffer(file);
    }
    inputElement.addEventListener('change', handleFileSelect, false);
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
