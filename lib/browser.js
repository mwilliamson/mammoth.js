var q = require("q");
var mammoth = require("./");

var converter = new mammoth.Converter(mammoth.standardOptions);
function handleFileSelect(event) {
    var files = event.target.files;

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        
        reader.onload = function(loadEvent) {
            var arrayBuffer = loadEvent.target.result;
            converter.convertToHtml({file: openFile(arrayBuffer)})
                .then(function(result) {
                    document.getElementById("output").innerHTML = result.html;
                })
                .done();
        };
        
        
        reader.readAsArrayBuffer(file);
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
}
  
document.getElementById("document").addEventListener('change', handleFileSelect, false);
